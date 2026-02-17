import Editor from "@monaco-editor/react";
import React from "react";
import { getTheme } from "../store/uistates";
import { useSelector } from "react-redux";

const LINE_HEIGHT = 20;
const MAX_HEIGHT = 800;
const TextArea = (props) => {
    const { content, type, themeName: themeProp, sourceKey } = props;
    const storedTheme = useSelector((state) => getTheme(state));
    const themeName = themeProp ?? storedTheme;
    let cont = content.replace(/\\n/g, "\n");
    const lines = (cont.match(/\n/g) || []).length + 1;

    let h = lines * LINE_HEIGHT;
    const height = h < MAX_HEIGHT ? h : MAX_HEIGHT;
    const OPTIONS = {
        lineHeight: LINE_HEIGHT,
        minimap: { enabled: h > MAX_HEIGHT ? true : false, side: "left", maxColumn: 60 },
        readOnly: true,
        wordWrap: "on",
        wrappingIndent: "same",
        scrollBeyondLastLine: false,
        scrollbar: {
            alwaysConsumeMouseWheel: false,
            vertical: "hidden",
            horizontal: "hidden",
            useShadows: false,
            verticalScrollbarSize: 0,
            horizontalScrollbarSize: 0
        }
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

    const modelPath = sourceKey
        ? `inmemory://model/${encodeURIComponent(String(sourceKey))}`
        : undefined;

    return (<Editor
        height={height}
        defaultLanguage={lang}
        defaultValue={cont}
        path={modelPath}
        theme={themeName === "dark" ? "vs-dark" : "vs"}
        readOnly
        className=" overflow-hidden"
        options={options}
    />);
}

const areEqual = (prevProps, nextProps) =>
    prevProps.content === nextProps.content
    && prevProps.type === nextProps.type
    && prevProps.themeName === nextProps.themeName
    && prevProps.sourceKey === nextProps.sourceKey;

export default React.memo(TextArea, areEqual);
