import {useEffect, useState} from 'react';
import {css, Global} from '@emotion/react';
import styled from '@emotion/styled';

function useAudio() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const [ctx] =  useState(new AudioContext());

  

  return {ctx};
}

function useSineGenerator(ctx: AudioContext) {

  const [oscNode] = useState(ctx.createOscillator());
  const [gainNode] = useState(ctx.createGain());

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentInterval, setCurrentInterval] = useState<number>(0);
  const [referenceFrequency, setReferenceFrequency] = useState(440);
  const [currentFrequency, setCurrentFrequency] = useState(referenceFrequency);


  useEffect(() => {
    gainNode.gain.value = 0;
  
    oscNode.connect(gainNode);
    gainNode.connect(ctx.destination);
    try {
    oscNode.start();
  } catch(e) {console.error(e);}
  }, []);

  useEffect(() => {
    gainNode.gain.value = isPlaying ? 1 : 0;
  }, [isPlaying]);

  useEffect(() => {
    const octaves: number = currentInterval / 12;
    const frequency = referenceFrequency * Math.pow(2, octaves);
    setCurrentFrequency(frequency);
  }, [currentInterval, referenceFrequency]);

  useEffect(() => {
    oscNode.frequency.setValueAtTime(currentFrequency, 0);
  }, [currentFrequency]);


  return { 
    play: () => {
      setIsPlaying(true);
    }, 
    pause: () => { 
        setIsPlaying(false);
    },
    toneUp: () => setCurrentInterval(currentInterval + 1),
    toneDown: () => setCurrentInterval(currentInterval - 1),
    currentFrequency,
    currentInterval,
    isPlaying,

    setReferenceFrequency,
  };
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


export default function Home() {
  if(typeof window === 'undefined') {
    return null;
  }
  const {ctx} = useAudio();
  const {play, pause, isPlaying, toneUp, toneDown, currentFrequency, currentInterval, setReferenceFrequency} = useSineGenerator(ctx);
  const [referenceNote, setReferenceNote] = useState<number>(440);

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
      if(isPlaying) {pause()}
      else {play()}
    }}>{isPlaying ? 'Stop' : 'Play' }</button>
      </PlaybackControlSection>

    <div><div>Reference: ({referenceNote}Hz)</div><div><input type="range" min={420} max={460} value={referenceNote} onChange={(e) => setReferenceNote(e.target.valueAsNumber) } /></div></div>
  </Container>
  );
}
