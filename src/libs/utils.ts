import fs from 'fs';
import archiver from 'archiver';

import logger from './logger';


export const isDev: boolean = process.env.NODE_ENV === 'development';

export const zipFiles = (fpath: string, flist: Array<string>, target: string) => {

    const fixpath = fpath.slice(-1) === '/'
        ? fpath.slice(0, -1)
        : fpath;

    const output = fs.createWriteStream(`${fixpath}/${target}.gzip`);

    // archive machine
    const am = archiver('zip', {
        gzip: true,
        gzipOptions: {
            level: 9
        }
    });
    return new Promise((resolve, reject) => {
        am.on('warning', (e) => {
            if (e.code === 'ENOENT') {
                logger.warn('am warning = %s', e.message);
                return;
            }
            reject(e);
        });

        am.on('error', reject);
        am.pipe(output);

        output.on('close', function () {
            logger.debug('zip total bytes = %d', am.pointer());
            logger.debug('zip target cloesd');
            resolve('ok');
        });

        output.on('end', function () {
            logger.debug('zip target drained');
        });

        Promise
            .resolve(flist.map((el: string) => {
                const elpath = `${fixpath}/${el}`;
                am.append(fs.createReadStream(elpath), {name: el});
            }))
            .then(() => {
                am.finalize();
            })
    });
}
