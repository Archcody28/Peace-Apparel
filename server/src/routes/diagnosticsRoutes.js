// TEMPORARY diagnostic (remove after live write-probe result is captured).
// Verifies, using the SHARED service-role client from supabaseService.js,
// whether the production server process can perform a write + cleanup against
// the subscribers table. Admin-protected; returns only safe status/error info.
import express from 'express';
import supabase from '../services/supabaseService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/supabase-write', requireAdmin, async (req, res) => {
  const ts = Date.now();
  const email = `diagnostic-${ts}@example.invalid`;

  let insertSucceeded = false;
  let cleanupSucceeded = false;
  let insertedId = null;
  let error = null;

  // Insert exactly one row using the minimum valid column (email) — the
  // same shape used by subscribersController.createSubscriber.
  const { data, error: insertError } = await supabase
    .from('subscribers')
    .insert({ email })
    .select('id')
    .single();

  if (insertError) {
    error = {
      code: insertError.code ?? null,
      message: insertError.message ?? String(insertError),
    };
    return res.json({
      success: false,
      insertSucceeded: false,
      cleanupSucceeded: false,
      error,
    });
  }

  insertSucceeded = true;
  insertedId = data && data.id ? data.id : null;

  // Immediately delete the inserted row.
  if (insertedId) {
    const { error: deleteError } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', insertedId);

    if (deleteError) {
      error = {
        code: deleteError.code ?? null,
        message: deleteError.message ?? String(deleteError),
      };
      return res.json({
        success: false,
        insertSucceeded,
        cleanupSucceeded: false,
        error,
        note: 'inserted row could not be removed; delete by id=' + String(insertedId),
      });
    }
    cleanupSucceeded = true;
  }

  res.json({
    success: true,
    insertSucceeded,
    cleanupSucceeded,
    insertedId,
  });
});

export default router;
