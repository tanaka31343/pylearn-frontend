importScripts("https://cdn.pyodide.org/v0.27.6/full/pyodide.js");

let pyodide = null;

async function loadPyodideInstance(onProgress) {
  if (!pyodide) {
    onProgress(10);
    pyodide = await loadPyodide();
    onProgress(85);
    // 標準ライブラリのウォームアップ
    pyodide.runPython("import sys, traceback\nfrom io import StringIO");
    onProgress(100);
  }
  return pyodide;
}

const ERROR_LABELS = {
  NameError:        "へんすうや　かんすうが　みつからないよ",
  SyntaxError:      "かきかたが　まちがっているよ",
  IndentationError: "字下げ（スペース）が　まちがっているよ",
  TypeError:        "つかいかたが　まちがっているよ",
  ZeroDivisionError:"0で　わることは　できないよ",
  ValueError:       "あたいが　まちがっているよ",
  AttributeError:   "そのそうさは　できないよ",
  IndexError:       "リストの　はんいを　こえているよ",
  KeyError:         "そのキーは　みつからないよ",
};

self.onmessage = async (event) => {
  const { id, code } = event.data;
  try {
    const py = await loadPyodideInstance((progress) => {
      self.postMessage({ id: -1, progress, stdout: "", stderr: "", exitCode: -1 });
    });

    if (id === -1) {
      self.postMessage({ id: -1, progress: 100, stdout: "", stderr: "", exitCode: 0 });
      return;
    }

    py.runPython(`
import sys, traceback
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
_last_error = None
`);

    let exitCode = 0;
    let stderr = "";

    try {
      py.runPython(code);
    } catch (_) {
      exitCode = 1;
      const errorInfo = py.runPython(`
import sys, traceback
_et, _ev, _tb = sys.exc_info()
_result = {"type": "", "line": -1, "detail": ""}
if _et is not None:
    _result["type"] = _et.__name__
    _result["detail"] = str(_ev)
    _tbs = traceback.extract_tb(_tb)
    if _tbs:
        _result["line"] = _tbs[-1].lineno
str(_result["type"]) + "|" + str(_result["line"]) + "|" + str(_result["detail"])
`);

      const [errType, lineStr, detail] = errorInfo.split("|");
      const lineNo = parseInt(lineStr);
      const label = ERROR_LABELS[errType] || "エラーが　おきたよ";
      const lineMsg = lineNo > 0 ? `${lineNo}行目に　` : "";

      let extra = "";
      if (errType === "NameError") {
        const nameMatch = detail.match(/name '(.+)' is not defined/);
        if (nameMatch) extra = `\n「${nameMatch[1]}」って　なんだろう？　つづりを　たしかめてね。`;
      } else if (errType === "SyntaxError") {
        const lineMatch = detail.match(/\(.*line (\d+)\)/);
        const syntaxLine = lineMatch ? lineMatch[1] : (lineNo > 0 ? lineNo : null);
        const finalLine = syntaxLine ? `${syntaxLine}行目に　` : "";
        stderr = `${finalLine}エラーが　あるよ！\n${label}`;
      }

      if (!stderr) {
        stderr = `${lineMsg}エラーが　あるよ！\n${label}${extra}`;
      }
    }

    const stdout = py.runPython("sys.stdout.getvalue()");

    py.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

    self.postMessage({ id, stdout, stderr, exitCode });
  } catch (e) {
    self.postMessage({ id, stdout: "", stderr: "エラーが　おきたよ。もう一度　ためしてみよう。", exitCode: 1 });
  }
};
