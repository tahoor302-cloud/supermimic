// ===== Community (UGC) content and upload integration =====
//
// UGC_ENDPOINT: URL of a backend that accepts the "Show us your tech" form as
// multipart/form-data (fields: name, handle, contact, product, caption, media,
// consent_rights, consent_usage) and returns HTTP 2xx when stored.
// While it is empty the form does NOT upload anything: it tells the visitor that
// and offers to send the details on WhatsApp instead.
const UGC_ENDPOINT = "";

// UGC_ITEMS: approved posts shown in the feed. Only add content you have the
// creator's permission to publish. Leave verified out unless you have checked
// the purchase. Example:
// {
//   type: "video",                       // "video" or "image"
//   src: "media/ugc/desk-setup.mp4",     // file in this site or a full URL
//   poster: "media/ugc/desk-setup.jpg",  // still image shown before playback
//   creator: "@handle",
//   caption: "My new desk setup",
//   product: "mechanical-keyboards",     // product id from catalog.js
//   verified: false                      // true only for a checked purchase
// }
const UGC_ITEMS = [];
