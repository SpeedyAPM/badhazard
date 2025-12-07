(function(w,d){
  var cfg=w.BadhazardConfig||{};
  var endpoint=cfg.endpoint||"/api/log-visit";
  var src=new URL(w.location.href);
  var searchParams=new URLSearchParams(src.search);
  if (searchParams.get("bh_nolog")==="1") { return; }
  var utm={source:searchParams.get("utm_source")||"brak",campaign:searchParams.get("utm_campaign")||"brak",medium:searchParams.get("utm_medium")||"brak"};
  var suspiciousWords=["bonus","free","free spin","bez podatku","cashback","gra bez ryzyka","gry losowe","legalne kasyno","nielegalne zakłady","rejestruj","odbierz bonus","777","sloty","jackpot","crypto","bet","wygraj"];
  var ref=d.referrer||"brak";
  var lowerRef=ref.toLowerCase(),lowerCampaign=(utm.campaign||"").toLowerCase(),lowerSource=(utm.source||"").toLowerCase(),lowerMedium=(utm.medium||"").toLowerCase();
  var matched=suspiciousWords.filter(function(word){return lowerRef.indexOf(word)>-1||lowerCampaign.indexOf(word)>-1||lowerSource.indexOf(word)>-1||lowerMedium.indexOf(word)>-1});
  var refHash=btoa(ref).slice(0,16);
  var ua=navigator.userAgent||"";
  var susUA=/vpn|tor|proxy|anonym|hide|incognito/i.test(ua);
  var payload={timestamp:new Date().toISOString(),location:w.location.href,referer:ref,refererHash:refHash,userAgent:ua,utm:utm,suspiciousMatches:matched,suspiciousUserAgent:susUA,suspicious:matched.length>0||susUA};
  try{var u=new URL(endpoint,w.location.origin);endpoint=u.toString()}catch(e){}
  try{fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(function(){})}catch(e){}
})(window,document);
