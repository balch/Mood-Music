
# Mood Music

This is a game where you guess the mood of AI-generated music. Test your intuition and see if you can identify the emotion behind the sound!

## How to Play

1.  **Start the Game**: When the app loads, you'll see a grid of six cards, each with a unique icon.
2.  **Listen to the Music**: Click on any card. You'll hear a piece of music generated to evoke a specific mood. The mood selection dropdown will automatically open.
3.  **Guess the Mood**: From the dropdown, select the mood that you think best matches the music. Once you select a mood, the music will stop, and your choice will be saved.
4.  **Complete the Board**: Repeat the process for all six cards.
5.  **Reveal Your Results**: Once you've made a guess for every card, the "Reveal" button in the footer will become active. Click it!
    *   Cards with **correct** guesses will be outlined in **green**.
    *   Cards with **incorrect** guesses will be outlined in **red**.
    *   The attempts counter in the header will increase.
6.  **Try Again**: If you have any incorrect guesses, the button will say "Try Again". You can click on the red-bordered cards to listen again and change your selection. Click "Reveal" again to re-check your answers.
7.  **You Win!**: When all your guesses are correct, the board will be outlined in green, and the footer button will turn into a victory button. Click it to hear a special celebration song!
8.  **New Game**: Click the "New Game" button in the header at any time to start over with a new set of moods and icons.

## Difficulty Modes

-   **Easy**: The dropdown will only show the six moods that are currently active in the game.
-   **Hard**: The dropdown will show all ten possible moods, making it more challenging to guess correctly.

Toggle the difficulty using the 🔥/🍰 button in the header.

## Development

This project is a single-page application built with React, TypeScript, and Tailwind CSS.

### Project Structure

-   `App.tsx`: The main application component, managing game state and logic.
-   `components/`: Contains reusable UI components like `Header`, `Footer`, `GameButton`, etc.
-   `constants.ts`: Defines core game data like moods and icons.
-   `services/`: Includes helper services for audio playback and logging.
-   `types.ts`: Holds all shared TypeScript type definitions.
-   `index.html` & `index.tsx`: Application entry points.

### AI Music Generation
[Lyria Realtime](https://ai.google.dev/gemini-api/docs/music-generation) is used for AI Music Generation. The GEMINI_API_KEY will need to be handled and managed securely and not be committed to source control.

The Lyria implementation is encapsulated in a LyriaService class and allows for generic configuration, prompts and audio handling and decoding. 
