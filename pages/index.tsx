import { useEffect, useState, useRef, forwardRef, MutableRefObject } from 'react';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';

function useSineGenerator() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const ctx = useRef<AudioContext | null>(null);
  const oscNode = useRef<OscillatorNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentInterval, setCurrentInterval] = useState<number>(0);
  const [referenceFrequency, setReferenceFrequency] = useState(440);
  const [currentFrequency, setCurrentFrequency] = useState(referenceFrequency);


  function trySetup() {
    if (ctx.current !== null) {
      return;
    }
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const context: AudioContext = new AudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();

    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start();

    ctx.current = context;
    oscNode.current = osc;
    gainNode.current = gain;

  }

  function calculateFrequency(interval: number, referenceFrequency: number) {
    const octaves: number = interval / 12;
    const frequency = referenceFrequency * Math.pow(2, octaves);
    return frequency;
  }

  return {
    play: () => {
      setIsStarted(prevState => {
        if (prevState === true) {
          return true;
        }
        trySetup();
        return true;
      });
      setIsPlaying((prevState) => {
        gainNode.current.gain.value = 1;
        return true;
      });
    },
    pause: () => {
      setIsPlaying((prevState) => {
        gainNode.current.gain.value = 0;
        return false;
      });
    },
    toneUp: () => setCurrentInterval(prevState => {
      const newInterval = prevState + 1;
      const newFreq = calculateFrequency(newInterval, referenceFrequency);

      oscNode.current.frequency.setValueAtTime(newFreq, 0);
      setCurrentFrequency(newFreq)
      return newInterval;
    }),
    toneDown: () => setCurrentInterval(prevState => {
      const newInterval = prevState - 1;
      const newFreq = calculateFrequency(newInterval, referenceFrequency);

      oscNode.current.frequency.setValueAtTime(newFreq, 0);
      setCurrentFrequency(newFreq)
      return newInterval;
    }),
    currentFrequency,
    currentInterval,
    isPlaying,

    setReferenceFrequency,
  };
}

function useSpeech(playTone, stopTone, upInterval, downInterval) {
  if (typeof window === 'undefined') {
    return {
      start: () => { },
    };
  }
  var SpeechRecognition = SpeechRecognition || (window as any).webkitSpeechRecognition;
  var SpeechGrammarList = SpeechGrammarList || (window as any).webkitSpeechGrammarList;
  var SpeechRecognitionEvent = SpeechRecognitionEvent || (window as any).webkitSpeechRecognitionEvent;

  const IDENTIFIED_COMMANDS = ['up', 'down', 'start', 'stop'];
  const grammar = `#JSGF V1.0; grammar colors; public <color> = ${IDENTIFIED_COMMANDS.join(' | ')};`

  const COMMAND_MAP = {
    'up': upInterval,
    'down': downInterval,
    'start': playTone,
    'stop': stopTone,
  }

  const recognition = useRef(new SpeechRecognition());
  const speechRecognitionList = useRef(new SpeechGrammarList());
  speechRecognitionList.current.addFromString(grammar, 1);
  recognition.current.grammars = speechRecognitionList.current;
  recognition.current.continuous = true;
  recognition.current.lang = 'en-US';
  recognition.current.interimResults = false;
  recognition.current.maxAlternatives = 1;

  recognition.current.onresult = (event) => {
    const numResults = event.results.length;
    const result = event.results[numResults - 1][0];
    const transcript = result.transcript.trim();
    const commands = transcript.split(' ').filter(r => r.length && IDENTIFIED_COMMANDS.indexOf(r) !== -1);
    for (const command of commands) {
      const func = COMMAND_MAP[command];
      if (func) {
        func();
      }
    }

  }
  recognition.current.onspeechend = () => {
    recognition.current.stop();
  }
  recognition.current.onerror = (event) => {
    console.error(event);
  }
  function start() {
    recognition.current.start();
  }

  return {
    start,
  }
}


const Container = (props: any) => {
  return (<>
    <Global styles={css`
      body {
        padding: 0;
        margin: 0;
      }
      #__next {
        background-color: #333333;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        height: 100vh;

        font-family: sans-serif;
        color: white;
        font-size: 1.3rem;
      }
    `} />
    {props.children}
  </>);
}

const PlaybackControlSection = (props: any) => {
  const _div = styled.div`

  button {
    border: 3px solid purple;
    padding: 2em;
  }
  `;
  return (
    <_div>
      {props.children}
    </_div>
  );
};

const IntervalControlSection = (props: any) => {
  const _div = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 100%;

  button {
    border: 3px solid purple;
    padding: 2em;
    width: 40%;
  }
  `;
  return (
    <_div>
      {props.children}
    </_div>
  );
};

const ReferenceControlSection = (props: any) => {
  const _div = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  * {
    width: 90%;
  }
  `;
  return (
    <_div>
      {props.children}
    </_div>
  );
};


export default function Home() {
  const { play, pause, isPlaying, toneUp, toneDown, currentFrequency, currentInterval, setReferenceFrequency } = useSineGenerator();
  const [referenceNote, setReferenceNote] = useState<number>(440);
  const { start } = useSpeech(play, pause, toneUp, toneDown);

  useEffect(() => {
    setReferenceFrequency(referenceNote);
  }, [referenceNote]);

  return (
    <Container>

      <div>Current: ({currentFrequency}Hz):</div>
      <div>Interval: {currentInterval}</div>

      <IntervalControlSection>
        <button onClick={() => {
          toneUp();
        }}>Up</button>
        <button onClick={() => {
          toneDown();
        }}>Down</button>
      </IntervalControlSection>

      <PlaybackControlSection>
        <button onClick={() => {
          if (isPlaying) { pause() }
          else { play(); start() }
        }}>{isPlaying ? 'Stop' : 'Play'}</button>
      </PlaybackControlSection>

      <ReferenceControlSection>
        <div>Reference: ({referenceNote}Hz)</div>
        <div>
          <input type="range" min={420} max={460} value={referenceNote} onChange={(e) => setReferenceNote(e.target.valueAsNumber)} />
        </div>
      </ReferenceControlSection>
    </Container>
  );
}
