// CloudFront Function (viewer-request, runtime cloudfront-js-2.0)
// Clean URLs for the Vivid site:
//   /services        -> serves /services.html   (invisible rewrite)
//   /services.html   -> 301 redirect to /services
//   /index.html      -> 301 redirect to /
//   /services/       -> 301 redirect to /services
// Requests with a file extension (images, css, js, robots.txt, sitemap.xml,
// feedback/comments.json, ...) pass through untouched.

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // 1) Old .html URLs -> permanent redirect to the clean form
  if (uri.endsWith('.html')) {
    var clean = uri.slice(0, -5); // strip ".html"
    if (clean === '/index' || clean === '') {
      clean = '/';
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: clean } }
    };
  }

  // 2) Root -> index.html
  if (uri === '/') {
    request.uri = '/index.html';
    return request;
  }

  // 3) Trailing slash (not root) -> redirect to the non-slash form
  if (uri.endsWith('/')) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri.slice(0, -1) } }
    };
  }

  // 4) No extension in the last path segment -> serve the .html object
  var lastSegment = uri.split('/').pop();
  if (lastSegment.indexOf('.') === -1) {
    request.uri = uri + '.html';
  }

  return request;
}
