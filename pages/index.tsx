import {useEffect, useState} from 'react';


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
    oscNode.start();
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
    //oscNode.frequency.value = currentFrequency;
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

  return [
  <div><button onClick={() => {
    if(isPlaying) {pause()}
    else {play()}
  }}>{isPlaying ? 'Pause' : 'Play' }</button></div>,
  <div>
<button onClick={() => {
  toneUp();
}}>Up</button>
  <button onClick={() => {
    toneDown();
  }}>Down</button>
  </div>,

  <div><div>Reference: ({referenceNote}Hz)</div><div><input type="range" min={420} max={460} value={referenceNote} onChange={(e) => setReferenceNote(e.target.valueAsNumber) } /></div></div>,
  <div>Current: ({currentFrequency}Hz):</div>,
  <div>Interval: {currentInterval}</div>
];
}
