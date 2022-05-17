import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Button from "./CustomButton";
import InputFile from "./InputFile";
import './InputForm.css';

export default class InputForm extends React.Component {
    render() {
        return (
            <div id="form">
                <h3 className="form-heading">Выбор режима ввода</h3>
                <Tabs>
                    <TabList style={this.props.isSending ? { 'pointerEvents': "none" } : {}}>
                        <Tab>Из файла</Tab>
                        <Tab>Вручную</Tab>
                    </TabList>
                    <TabPanel>
                        <InputFile handleFile={this.props.handleFile}
                            file={this.props.file}
                            isFileRead={this.props.isFileRead}
                            isSending={this.props.isSending}
                        />
                    </TabPanel>
                    <TabPanel>
                        <span>Manual</span>
                    </TabPanel>
                </Tabs>
                <div className="button-group">
                    <Button className="send_btn" children='Отправить' disabled={!(this.props.connection && this.props.isFileRead && !this.props.isSending)} onClick={this.props.handleSend} />
                    <Button className="send_btn" children='Отрендерить' onClick={this.props.renderFile} disabled={this.props.isSending} />
                </div>
            </div>
        );
    }
}