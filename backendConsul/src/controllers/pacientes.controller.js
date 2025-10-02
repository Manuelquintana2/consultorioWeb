import fs from "fs";
import path from "path";
import pool from "../database/postgres.js"; // tu conexión
const UPLOADS_DIR = path.join(process.cwd(), "src/uploads");

// ✅ Eliminar PDF
export const eliminarPdfPaciente = async (req, res) => {
  try {
    const { uid, pdfId } = req.params;

    const result = await pool.query(
      "SELECT * FROM pdf_pacientes WHERE id = $1 AND uid_paciente = $2",
      [pdfId, uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "PDF no encontrado" });
    }

    const pdf = result.rows[0];
    const filePath = path.join(UPLOADS_DIR, pdf.path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM pdf_pacientes WHERE id = $1", [pdfId]);

    res.json({ success: true, message: "PDF eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar PDF:", error);
    res.status(500).json({ success: false, message: "Error interno al eliminar el PDF" });
  }
};
