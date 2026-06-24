importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.6/full/pyodide.js");

let pyodide = null;

async function loadPyodideInstance() {
  if (!pyodide) {
    pyodide = await loadPyodide();
  }
  return pyodide;
}

self.onmessage = async (event) => {
  const { id, code } = event.data;
  try {
    const py = await loadPyodideInstance();

    // ウォームアップ専用: ロード完了を通知するだけ
    if (id === -1) {
      self.postMessage({ id: -1, stdout: "", stderr: "", exitCode: 0 });
      return;
    }

    // stdout/stderr をキャプチャ
    py.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);

    let exitCode = 0;
    try {
      py.runPython(code);
    } catch (e) {
      exitCode = 1;
      py.runPython(`sys.stderr.write(${JSON.stringify(String(e))})`);
    }

    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");

    // リセット
    py.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

    self.postMessage({ id, stdout, stderr, exitCode });
  } catch (e) {
    self.postMessage({ id, stdout: "", stderr: String(e), exitCode: 1 });
  }
};
