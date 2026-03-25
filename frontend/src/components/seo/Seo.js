import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Coury';
const DEFAULT_DESCRIPTION = 'Coury helps students manage courses, schedule classes, track learning progress, and stay organized in one platform.';
const DEFAULT_IMAGE = '/cover.png';
const BASE_URL = process.env.REACT_APP_SITE_URL || 'https://coury.vercel.app';

const resolveUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  structuredData
}) => {
  const canonical = resolveUrl(path);
  const imageUrl = image.startsWith('http') ? image : resolveUrl(image);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Smart Course Management`;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};

export default Seo;
