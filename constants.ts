
import { Mood, Icon } from './types';
import { BassIcon, DroneIcon, InteractionIcon, LeadIcon, ParticlesIcon, ResonanceIcon, SwooshIcon } from './components/icons';

export const MOODS: Mood[] = [
    { name: 'Angry', emoji: '💢', prompt: 'Intense, aggressive, Heavy Metal, Grunge, Thrash, mosh pit, distorted sounds, fast chaotic rhythms, minor key, driving heavy percussion, dissonant textures, industrial elements, building tension.' },
    { name: 'Happy', emoji: '🎉', prompt: 'Uplifting, joyful melodies, reggae, flute, kazoo, bright major key, bouncy rhythms, sparkling arpeggios, celebratory fanfares, clear synth tones, positive energy, vibrant.' },
    { name: 'Playful', emoji: '🤹', prompt: 'Whimsical, quirky, light pizzicato-like sounds, unexpected melodic turns, curious and lighthearted, major key with playful dissonance, toy piano or glockenspiel textures, staccato phrases.' },
    { name: 'Sad', emoji: '🌧️', prompt: 'Slow, melancholic, minor key, sustained pads, sparse piano or string melodies, ethereal textures, a sense of longing and introspection, gentle swells, reflective mood.' },
    { name: 'Romantic', emoji: '🌹', prompt: 'Deep, passionate, yearning melodies, lush evolving synth textures, slow to mid-tempo, strong rhythmic pulse, sense of cosmic desire and connection, rich harmonies, perhaps with a touch of bluesy tension and release.' },
    { name: 'Tired', emoji: '🪫', prompt: 'Very slow, lethargic, minimal and sparse, low sustained drones, soft filtered sounds, a sense of drifting and weariness, almost static but with subtle slow movement, deep ambient textures, fading energy.' },
    { name: 'Relaxed', emoji: '🍸', prompt: 'Calm, peaceful, flowing ambient textures, slow shimmering pads, deep space exploration, gentle consonant melodies, serene and tranquil, light ethereal choir sounds, meditative.' },
    { name: 'Annoyed', emoji: '😤', prompt: 'Agitated, repetitive, slightly dissonant motifs, nervous energy, short staccato sounds, underlying tension, a driving but slightly off-kilter rhythm, minor key with sharp accents, unresolved phrases.' },
    { name: 'Energetic', emoji: '⚡️', prompt: 'Fast-paced, driving rhythms, bright and crisp synth leads, uplifting major key progressions, powerful electronic beats, sense of rapid movement and excitement, arpeggiated sequences, building intensity.' },
    { name: 'Creative', emoji: '🧠', prompt: 'Experimental, evolving soundscapes, unexpected instrumental textures, blend of electronic and organic sounds, polyrhythms, modal harmonies, a sense of discovery and wonder, free-flowing and improvisational feel' },
];

export const ICONS: Icon[] = [
    { name: 'Bass', Component: BassIcon, color: '#a5b4fc' }, // indigo-300
    { name: 'Drone', Component: DroneIcon, color: '#6366f1' }, // indigo-500
    { name: 'Interaction', Component: InteractionIcon, color: '#d946ef' }, // fuchsia-500
    { name: 'Lead', Component: LeadIcon, color: '#84cc16' }, // lime-500
    { name: 'Particles', Component: ParticlesIcon, color: '#38bdf8' }, // sky-400
    { name: 'Resonance', Component: ResonanceIcon, color: '#fb923c' }, // orange-400
    { name: 'Swoosh', Component: SwooshIcon, color: '#f59e0b' }, // amber-500
];
