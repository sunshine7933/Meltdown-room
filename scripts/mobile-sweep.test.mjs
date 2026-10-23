// Current standalone website/room sweep; the old iframe assumptions are obsolete.
import {createRequire} from 'node:module';
createRequire(import.meta.url)('./website-sweep.test.cjs');
