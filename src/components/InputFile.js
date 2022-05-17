import React, { memo } from "react";
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import './InputFile.css';
import './Button.css'


// import { GCodeInterpreter } from "../functions/gcode_interpreter";

const Command = memo(({ data, index, style }) => {
    const codeRef = React.useRef(null);
    if (data[index].isSent && codeRef.current !== null) {
        codeRef.current.scrollIntoView({
            block: "center"
        })
    }
    return (
        <div id={`code-${index}`} className={data[index].isSent ? "ListItem-sent ListItem" : "ListItem"} style={style} ref={codeRef}>
            {data[index].toString()}
        </div>
    )
}, areEqual);

const InputFile = (props) => {
    return (
        <div id='code-field'>
            <div id='command-list'>
                {props.file !== null && <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className="commands"
                            height={height}
                            itemCount={props.file.codes.length}
                            itemSize={50}
                            width={width}
                            itemData={props.file.codes}
                        >
                            {Command}
                        </List>
                    )}
                </AutoSizer>}
            </div>

            <label id="input-file" className="btn btn-input-file" style={props.isSending ? { "visibility": "hidden" } : { "visibility": "initial" }} htmlFor='file'>
                Выбрать файл
                <input id="file" type="file" onChange={props.handleFile} />
            </label>
        </div>
    )
}

export default InputFile;