// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import fs from 'fs'

type Data = {
  name: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  if (fs.existsSync('aa.json')) {


    console.log('yes');
  } else {
    fs.writeFile('aa.json', '', function (err) {
      if (err) throw err;
      console.log('Saved!');
    });

  }
  res.status(200).json({ name: 'John Doesasdsad' })
}
