import { NewCharacter } from './Character';
import { PlayerInfo } from './PlayerInfo';

export const RemotePlayer = ({ position = [0,0,0], rotationY = 0, animation='Idle', health=120, profile={name:'玩家',color:'#00ffff'}, id }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <PlayerInfo health={health} profile={profile} />
      <NewCharacter scale={[2,2,2]} animation={animation} profile={profile} />
    </group>
  );
}; 