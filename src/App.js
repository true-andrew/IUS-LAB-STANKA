import './App.css';
import React from 'react';

import InputForm from './components/InputForm';
import RenderArea from './components/RenderArea';
import { GCodeParser } from './functions/gcode_index';
import { GCodeRenderer } from './functions/gcode_renderer';
import Button from './components/CustomButton';
import Modal from './components/Modal';

import mirea from './1.png'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFileRead: false,
      gcodeModel: null,
      object3D: null,
      modalActive: false,
      ipAddress: '',
      connection: false,
      isSending: false,
      currentCommand: -1,
    };
    this.setModalActive = this.setModalActive.bind(this);
    this.handleFile = this.handleFile.bind(this);
    this.renderFile = this.renderFile.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSend = this.handleSend.bind(this);
  }

  setModalActive() {
    this.setState(state => ({
      modalActive: !state.modalActive
    }))
  }

  renderFile() {
    if (this.state.gcodeModel !== null) {
      const renderer = new GCodeRenderer();
      this.setState(state => ({
        object3D: renderer.render(state.gcodeModel)
      }))
    }
  }

  handleFile(ev) {
    this.setState({
      isFileRead: false,
      gcodeModel: null,
      object3D: null,
    });
    let file = ev.target.files[0];
    const reader = new FileReader();
    const parser = new GCodeParser();

    if (!file) return;

    reader.readAsText(file);

    reader.onload = () => {
      this.setState({
        gcodeModel: parser.parse(reader.result),
        isFileRead: true
      });

    }
  }

  handleInput(ev) {
    this.setState({
      ipAddress: ev.target.value,
    })
  }

  handleSubmit(event) {
    if (this.state.ipAddress === '192.168.1.1:5050') {
      setTimeout(() => {
        this.setState(state => ({
          connection: !state.connection,
        }));
      }, 1000);
    }
    event.preventDefault();
  }

  handleSend() {
    this.setState(
      state => ({
        isSending: !state.isSending,
      })
    );
    const model = this.state.gcodeModel;
    function fakeFetch(code) {
      return new Promise(resolve => {
        setTimeout(() => resolve(`${code} is DONE`), 0.1);
      })
    };
    async function asyncAwaitWay() {
      for (let i = 0; i < model.codes.length; i++) {
        await fakeFetch(model.codes[i]).then(() => {
          this.setState(prevState => ({
            gcodeModel: prevState.gcodeModel.setSendStatus(i),
            currentCommand: i,
          }));
        });
      }
      setTimeout(() => {
        this.setState({
          isFileRead: false,
          isSending: false
        });
      }, 5000)

    }
    const _asyncAwaitWay = asyncAwaitWay.bind(this);
    _asyncAwaitWay();
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div className='mirea'>
            <img src={mirea} alt='mirea' />
            <h2>Кафедра ПИ</h2>
          </div>
          <h1 className="header-heading">ИУС Лабораторного стенда</h1>
          <Button children='Ввод параметров подключения' onClick={this.setModalActive} />
        </header>

        <InputForm
          handleFile={this.handleFile}
          renderFile={this.renderFile}
          file={this.state.gcodeModel}
          isFileRead={this.state.isFileRead}
          connection={this.state.connection}
          isSending={this.state.isSending}
          handleSend={this.handleSend}
        />
        <RenderArea id="render-area"
          object3D={this.state.object3D}
          isSending={this.state.isSending}
          currentCommand={this.state.currentCommand}
        />

        <Modal active={this.state.modalActive} setActive={this.setModalActive}>
          <form className='network-parameters-form'>
            <h3 className="form-heading">Введите параметры подключения</h3>
            <input className='network-input' type='text' value={this.state.ipAddress} onChange={this.handleInput} />
            <Button children={this.state.connection ? 'Подключение установлено' : 'Подключиться'} disabled={this.state.connection} onClick={this.handleSubmit} />
          </form>
        </Modal>
      </div>
    );
  }
}

export default App;
