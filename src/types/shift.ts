export interface Shift {
    id: number;
    employee_id: number;
    date: string;
    start_time: string;
    end_time: string;
    break_duration?: string;
    hourly_rate: number;
    total_hours?: number;
    created_at?: string;
    user_id: number;
}
