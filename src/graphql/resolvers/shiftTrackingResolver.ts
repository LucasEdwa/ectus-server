import { 
  createShiftTracking,
  getCurrentShiftByEmployee,
  updateShiftTracking,
  getShiftHistory,
  stopShiftTracking
} from '../../models/shiftTrackingModel';
import { updateTimeBalanceByEmployeeId } from '../../models/timeBalanceModel';
import { getShiftForEmployeeOnDate } from '../../models/shiftModel';

interface Context {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id: number;
  };
}


// helper moved outside resolver object so it can be referenced from both
// mutations without violating object literal syntax.
async function validateScheduledTime(
  employeeId: number,
  isoTimestamp: string,
  when: 'start' | 'end'
) {
  const actual = new Date(isoTimestamp);
  const dateKey = actual.toISOString().slice(0, 10);
  const schedule = await getShiftForEmployeeOnDate(employeeId, dateKey);

  if (!schedule) {
    throw new Error(`No scheduled shift found for ${dateKey}`);
  }

  const scheduledStart = new Date(`${dateKey} ${schedule.start_time}`);
  const scheduledEnd = new Date(`${dateKey} ${schedule.end_time}`);

  if (when === 'start' && actual < scheduledStart) {
    throw new Error('Cannot start shift before scheduled start time');
  }
  if (when === 'start' && actual > scheduledEnd) {
    throw new Error('Cannot start shift after scheduled end time');
  }
  if (when === 'end' && actual < scheduledStart) {
    throw new Error('Cannot end shift before scheduled start time');
  }
  if (when === 'end' && actual > scheduledEnd) {
    throw new Error('Cannot end shift after scheduled end time');
  }

  // return schedule in case caller wants it
  return schedule;
}

export const shiftTrackingResolvers = {
  Query: {
    getCurrentShift: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      try {
        const currentShift = await getCurrentShiftByEmployee(context.user.id);
        return currentShift;
      } catch (error) {
        console.error('Error getting current shift:', error);
        throw new Error('Failed to get current shift');
      }
    },

    getShiftHistory: async (_: any, { limit = 10 }: { limit?: number }, context: Context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      try {
        const history = await getShiftHistory(context.user.id, limit);
        return history;
      } catch (error) {
        console.error('Error getting shift history:', error);
        throw new Error('Failed to get shift history');
      }
    },
  },

  Mutation: {
    startShiftTracking: async (_: any, { start_time }: { start_time: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      try {
        // make sure there are no active shifts already
        const existingShift = await getCurrentShiftByEmployee(context.user.id);
        if (existingShift) {
          throw new Error('You already have an active shift. Please end it before starting a new one.');
        }

        // validate against schedule boundaries (throws on failure)
        await validateScheduledTime(context.user.id, start_time, 'start');

        const shiftData = {
          employee_id: context.user.id,
          start_time,
          on_break: false,
          total_break_time: 0,
          total_worked_time: 0,
          break_count: 0,
          shift_status: 'active' as const
        };

        const newShift = await createShiftTracking(shiftData);
        return newShift;
      } catch (error) {
        console.error('Error starting shift:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to start shift');
      }
    },

    stopShiftTracking: async (
      _: any,
      { id, end_time, total_worked_time, shift_status }: {
        id: number;
        end_time: string;
        total_worked_time: number;
        shift_status: string;
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      // Validate input types
      if (typeof id !== 'number') throw new Error('ID must be an integer');
      if (typeof end_time !== 'string') throw new Error('End time must be a string');
      if (typeof total_worked_time !== 'number') throw new Error('Total worked time must be a number');
      if (typeof shift_status !== 'string') throw new Error('Shift status must be a string');

      try {
        // fetch existing active shift to validate against schedule
        const currentShift = await getCurrentShiftByEmployee(context.user.id);
        if (!currentShift || currentShift.id !== id) {
          throw new Error('No matching active shift found');
        }

        const startMillis = parseInt(currentShift.start_time);
        const shiftDate = new Date(startMillis).toISOString().slice(0, 10);
        // re‑use validation helper for symmetry with startShiftTracking
        await validateScheduledTime(context.user.id, end_time, 'end');

        const completedShift = await stopShiftTracking(id, end_time, total_worked_time);

        // Update time balance with worked hours
        const workedHours = total_worked_time / 3600; // Convert seconds to hours
        
        try {
          await updateTimeBalanceByEmployeeId(context.user.id, {
            flexible_hours: workedHours, // Add worked hours to flexible balance
          });
        } catch (error) {
          console.log('Note: Time balance update failed, but shift was completed successfully');
        }

        return completedShift;
      } catch (error) {
        console.error('Error stopping shift:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stop shift');
      }
    },

    updateShiftTracking: async (
      _: any,
      { 
        id, 
        on_break, 
        break_start, 
        break_end, 
        total_break_time, 
        break_count, 
        shift_status 
      }: {
        id: number;
        on_break?: boolean;
        break_start?: string;
        break_end?: string;
        total_break_time?: number;
        break_count?: number;
        shift_status?: string;
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      try {
        const updates: any = {};
        
        if (on_break !== undefined) updates.on_break = on_break;
        if (break_start !== undefined) updates.break_start = break_start;
        if (break_end !== undefined) updates.break_end = break_end;
        if (total_break_time !== undefined) updates.total_break_time = total_break_time;
        if (break_count !== undefined) updates.break_count = break_count;
        if (shift_status !== undefined) updates.shift_status = shift_status;

        const updatedShift = await updateShiftTracking(id, updates);
        return updatedShift;
      } catch (error) {
        console.error('Error updating shift:', error);
        throw new Error('Failed to update shift');
      }
    },
  },
};