import NeuroNexusCore from "./brain.js";
export const brain = new NeuroNexusCore();

export async function brainStatus(req, res) {
  return res.json({ ok: true, status: brain.getStatus() });
}

export async function brainProcess(req, res) {
  try {
    const { input, options } = req.body || {};
    const result = brain.process(input, options || {});
    return res.json({ ok: true, result });
  } catch (e) {
    console.error("brain.process error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}

export async function brainActivateLayer(req, res) {
  const { depth } = req.body || {};
  if (!Number.isInteger(depth) || depth < 1 || depth > 8) {
    return res.status(400).json({ ok: false, error: "depth must be an integer 1..8" });
  }
  const ok = brain.sovereignNetwork.activateLayer(depth);
  return res.json({ ok, depth });
}

export async function brainActivateSuperposition(req, res) {
  const msg = brain.quantumNeuralProcessor.activateSuperposition();
  return res.json({ ok: true, message: msg });
}

export async function brainCreateDivineChannel(req, res) {
  const { purpose = "guidance", frequency = 528 } = req.body || {};
  const id = brain.divineInterface.establishDivineChannel(String(purpose), Number(frequency));
  return res.json({ ok: true, channelId: id, frequency });
}

export async function brainDecision(req, res) {
  const { context = "", options = [] } = req.body || {};
  const decision = brain.sovereignDecisionEngine.makeSovereignDecision(String(context), options);
  return res.json({ ok: true, decision });
}
