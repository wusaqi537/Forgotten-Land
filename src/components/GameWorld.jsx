import { Scene } from "./Scene";
import { CharacterController } from "./CharacterController";

export const GameWorld = ({ downgradedPerformance = false }) => {
  return (
    <>
      <Scene />
      <CharacterController
        userPlayer={true}
        downgradedPerformance={downgradedPerformance}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3,5,2]} intensity={0.8} />
    </>
  );
};
