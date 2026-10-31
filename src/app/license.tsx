import { Heading, InfoPage, Para } from '@/components/info-page';

// Keep in sync with the LICENSE file at the repo root.
const MIT = [
  'Copyright (c) 2026 QunioSoyez',
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
];

export default function LicenseScreen() {
  return (
    <InfoPage title="License">
      <Heading>Berean app — MIT License</Heading>
      {MIT.map((p, i) => (
        <Para key={i} small={i === MIT.length - 1}>
          {p}
        </Para>
      ))}

      <Heading>Bible texts</Heading>
      <Para>
        The bundled Bible versions are in the public domain and are not covered by the license
        above. See About & credits for sources.
      </Para>
    </InfoPage>
  );
}
