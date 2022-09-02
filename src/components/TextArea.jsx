import Editor from "@monaco-editor/react";
import React from "react";
import { getTheme } from "../store/uistates";
import { useSelector } from "react-redux";

const LINE_HEIGHT = 20;
const MAX_HEIGHT = 800;
const TextArea = (props) => {
    const { content, type } = props;
    const themeName = useSelector((state) => getTheme(state));
    let cont = content.replace(/\\n/g, "\n");
    const lines = (cont.match(/\n/g) || []).length + 1;

    let h = lines * LINE_HEIGHT;
    const height = h < MAX_HEIGHT ? h : MAX_HEIGHT;
    const OPTIONS = {
        lineHeight: LINE_HEIGHT,
        minimap: { enabled: h > MAX_HEIGHT ? true : false, side: "left", maxColumn: 60 },
        readOnly: true,
        scrollBeyondLastLine: false,
        scrollbar: { alwaysConsumeMouseWheel: false }
    }

    let lang;
    let options;
    switch (type?.toLowerCase()) {
        case "xml":
            lang = "xml";
            options = { ...OPTIONS } //override or add if needed
            break;
        case "json":
            lang = "json";
            options = { ...OPTIONS }
            break;
        default:
            lang = "batch"
            options = { ...OPTIONS }
            break;
    }

    return (<Editor
        height={height}
        defaultLanguage={lang}
        defaultValue={cont}
        theme={themeName === "dark" ? "vs-dark" : "vs"}
        readOnly
        className=" overflow-hidden"
        options={options}
    />);
}
export default TextArea;