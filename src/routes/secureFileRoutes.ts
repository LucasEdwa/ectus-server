import path from "path";
import express from "express";
import { authenticateToken } from "../middleware/jwtAuth";
import { db } from "../models/db";
import { assertViewerMayAccessDocumentRow, assertViewerMayAccessPaylist } from "../graphql/helpers/tenantChecks";

const router = express.Router();

const paylistsRoot = path.resolve(__dirname, "../../paylists");
const documentsRoot = path.resolve(__dirname, "../../documents");

router.get("/paylists/:filename", authenticateToken, async (req, res) => {
  try {
    const viewer = req.user;
    if (!viewer?.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const raw = String(req.params.filename ?? "");
    const filename = path.basename(decodeURIComponent(raw));
    if (!filename || filename === "." || filename === "..") {
      res.status(400).send("Invalid filename");
      return;
    }

    const reqUrl = `/paylists/${filename}`;
    const [[paylist]]: any = await db.query(
      "SELECT company_id, employee_id FROM paylists WHERE pdf_url = ? LIMIT 1",
      [reqUrl]
    );

    if (!paylist) {
      res.status(404).send("Not found");
      return;
    }

    await assertViewerMayAccessPaylist({ ...viewer, id: viewer.id }, paylist);

    const diskPath = path.resolve(paylistsRoot, filename);
    if (!diskPath.startsWith(paylistsRoot + path.sep) && diskPath !== paylistsRoot) {
      res.status(400).send("Invalid path");
      return;
    }

    res.sendFile(diskPath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    res.status(403).send(msg);
  }
});

router.get("/documents/:filename", authenticateToken, async (req, res) => {
  try {
    const viewer = req.user;
    if (!viewer?.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const raw = String(req.params.filename ?? "");
    const filename = path.basename(decodeURIComponent(raw));
    if (!filename || filename === "." || filename === "..") {
      res.status(400).send("Invalid filename");
      return;
    }

    const reqUrl = `/documents/${filename}`;
    const [[doc]]: any = await db.query(
      "SELECT company_id, employee_id FROM documents WHERE file_url = ? LIMIT 1",
      [reqUrl]
    );

    if (!doc) {
      res.status(404).send("Not found");
      return;
    }

    await assertViewerMayAccessDocumentRow({ ...viewer, id: viewer.id }, doc);

    const diskPath = path.resolve(documentsRoot, filename);
    if (!diskPath.startsWith(documentsRoot + path.sep) && diskPath !== documentsRoot) {
      res.status(400).send("Invalid path");
      return;
    }

    res.sendFile(diskPath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    res.status(403).send(msg);
  }
});

export default router;
