import * as p5 from 'p5';
// We bind p5 to window/root so p5.sound can access it:
const root = window ?? {};
root.p5 = p5; // This is a p5 static, type = typeof p5 not  p5

// For some reason importing from node_modules doens't work:
// eslint-disable-next-line import/first
import './p5.sound';
console.log('Imported p5.sound');
export default root.p5;
