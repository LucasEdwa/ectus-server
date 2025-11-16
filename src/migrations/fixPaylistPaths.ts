import { db } from "../models/db";
import path from "path";

export async function fixPaylistPaths() {
  try {

    // Get all paylists
    const [paylists]: any = await db.query("SELECT id, pdf_url FROM paylists");


    for (const paylist of paylists) {
      // Extract just the filename from the full path
      const filename = path.basename(paylist.pdf_url);
      const newUrl = `/paylists/${filename}`;

      // Update the record
      await db.query("UPDATE paylists SET pdf_url = ? WHERE id = ?", [
        newUrl,
        paylist.id,
      ]);

      console.log(`Updated paylist ${paylist.id}: ${paylist.pdf_url} -> ${newUrl}`);
    }

  } catch (error) {
    console.error("Error during paylist path migration:", error);
    throw error;
  }
}
