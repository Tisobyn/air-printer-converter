from xml.sax.saxutils import escape as E
HEAD='''<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 794 1123" font-family="Helvetica, Arial, sans-serif">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker>
<marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#444"/></marker>
<marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b3261e"/></marker>
<marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2e8b45"/></marker></defs>
<rect width="794" height="1123" fill="#fff"/>
'''
COL={"gray":("#eef2f7","#5b6b82"),"blue":("#e8f1ff","#2f6fdb"),"green":("#e9f7ec","#2e8b45"),"red":("#fdecea","#b3261e"),"amber":("#fff7e6","#c98a1b"),"purple":("#f3eefb","#7a4fc0"),"white":("#ffffff","#999")}
MK={"#444":"a1","#b3261e":"a2","#2e8b45":"a3"}
def T(x,y,s,size=12,w="normal",fill="#444",anchor="start"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" font-weight="{w}" fill="{fill}">{E(s)}</text>\n'
def box(x,y,w,h,title,lines=(),c="gray",dash=False,tsize=13):
    f,s=COL[c]; d=' stroke-dasharray="6 4"' if dash else ''
    o=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{f}" stroke="{s}" stroke-width="1.5"{d}/>\n'
    n=len(lines); top=y+h/2-(n*7)-(0 if n else 0)+ (4 if n==0 else 0)
    if n==0: return o+T(x+w/2,y+h/2+5,title,tsize,"bold","#1a1a1a","middle")
    ty=y+h/2-n*7-2+ (0)
    o+=T(x+w/2,ty,title,tsize,"bold","#1a1a1a","middle")
    for i,l in enumerate(lines): o+=T(x+w/2,ty+17+i*14,l,11,"normal","#444","middle")
    return o
def arrow(x1,y1,x2,y2,c="#444",dash=False,label=None,lx=None,ly=None,anchor="start"):
    d=' stroke-dasharray="5 4"' if dash else ''
    o=f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="1.5"{d} marker-end="url(#{MK[c]})"/>\n'
    if label: o+=T(lx if lx is not None else (x1+x2)/2, ly if ly is not None else y1-6,label,10.5,"normal",c if c!="#444" else "#333","middle" if lx is None else anchor)
    return o
def head(title,sub):
    return T(397,50,title,24,"bold","#1a1a1a","middle")+T(397,74,sub,14,"normal","#555","middle")
def h2(x,y,s,x2=734): return T(x,y,s,15,"bold","#1a1a1a")+f'<line x1="{x}" y1="{y+8}" x2="{x2}" y2="{y+8}" stroke="#ccc"/>\n'
def write(name,body): open(name,"w").write(HEAD+body+"</svg>\n")

# ---------- Page 2: sequence ----------
b=head("Request sequence","What happens, in order")
X={"app":110,"srv":292,"cc":474,"lo":656}
names={"app":("iOS / Android","app","gray"),"srv":("Our server","Node + Express","amber"),"cc":("CloudConvert","online, first","blue"),"lo":("LibreOffice","our server, backup","green")}
for k,x in X.items():
    t,s,c=names[k]; b+=box(x-70,100,140,46,t,[s],c)
    b+=f'<line x1="{x}" y1="146" x2="{x}" y2="1000" stroke="#bbb" stroke-width="1.2" stroke-dasharray="4 4"/>\n'
b+=arrow(110,190,292,190,label="POST /convert (file)")
b+=f'<rect x="212" y="208" width="160" height="32" rx="6" fill="#fff7e6" stroke="#c98a1b"/>'+T(292,222,"check key, size, type,",10.5,anchor="middle")+T(292,235,"and real content",10.5,anchor="middle")
# normal region
b+=f'<rect x="60" y="262" width="674" height="136" rx="8" fill="#f2f8ff" stroke="#2f6fdb" stroke-dasharray="6 4"/>'+T(72,280,"Normal: CloudConvert works",12,"bold","#2f6fdb")
b+=arrow(292,310,474,310,label="create job, upload file")
b+=arrow(474,346,292,346,dash=True,label="PDF ready (download)")
b+=arrow(292,382,474,382,label="delete the job")
# fallback region
b+=f'<rect x="60" y="418" width="674" height="196" rx="8" fill="#fff4f3" stroke="#b3261e" stroke-dasharray="6 4"/>'+T(72,436,"Fallback: CloudConvert fails, is slow (45 s), or no key",12,"bold","#b3261e")
b+=arrow(292,470,474,470,label="create job, upload file")
b+=arrow(474,506,292,506,"#b3261e",True,"error or timeout")
b+=arrow(292,552,656,552,label="convert locally (max 60 s)")
b+=arrow(656,590,292,590,dash=True,label="PDF")
# end
b+=f'<rect x="212" y="640" width="160" height="32" rx="6" fill="#f3eefb" stroke="#7a4fc0"/>'+T(292,654,"delete temp files",10.5,anchor="middle")+T(292,667,"on our server",10.5,anchor="middle")
b+=arrow(292,706,110,706,"#2e8b45",label="200 OK + PDF",lx=201,ly=698,anchor="middle")
b+=T(201,722,"header X-Converted-By",10,"normal","#555","middle")
b+=f'<rect x="40" y="740" width="140" height="32" rx="6" fill="#eef2f7" stroke="#5b6b82"/>'+T(110,760,"shows the PDF",11,anchor="middle")
b+=h2(60,840,"Reading the diagram")
b+=T(60,868,"Solid arrow = a request.  Dashed arrow = an answer.  Blue box = normal path.  Red box = fallback path.",12)
b+=T(60,890,"If both engines fail, the app gets a JSON error: 422 (broken file), 503 (LibreOffice busy), 504 (too slow).",12)
b+=T(60,912,"The app never chooses the engine. The server decides.",12)
write("DIAGRAM_SEQUENCE.svg",b)

# ---------- Page 3: scaling ----------
b=head("Scaling","What changes from 100 to 1000 users")
b+=box(40,100,340,34,"Today: about 100 users",c="blue",tsize=14)
b+=box(414,100,340,34,"Later: about 1000 users",c="amber",tsize=14)
# left
b+=box(110,170,200,40,"Apps",["iOS and Android"],"gray")
b+=arrow(210,210,210,240,)
b+=box(90,242,240,56,"1 server container",["2 GB RAM, 2 CPU","built and working"],"green")
b+=arrow(160,298,120,336); b+=arrow(260,298,300,336)
b+=box(50,338,150,50,"CloudConvert",["first"],"blue"); b+=box(220,338,150,50,"LibreOffice",["backup, 2 at a time"],"green")
b+=T(210,420,"Extra jobs beyond 2 at a time get",11,anchor="middle")+T(210,435,"503 busy, only when CloudConvert fails.",11,anchor="middle")
# right
b+=box(484,170,200,40,"Apps",["iOS and Android"],"gray")
b+=arrow(584,210,584,226)
b+=box(464,228,240,36,"Rate limit per user / IP",c="amber",dash=True,tsize=12)
b+=arrow(584,264,584,282)
b+=box(464,284,240,36,"Load balancer",c="amber",dash=True,tsize=12)
b+=arrow(560,320,500,346); b+=arrow(584,320,584,346); b+=arrow(608,320,668,346)
for i,x in enumerate((424,534,644)): b+=box(x,348,100,44,f"Server {i+1}",["same image"],"green",dash=True,tsize=12)
b+=arrow(584,392,584,416)
b+=box(464,418,240,40,"CloudConvert, then LibreOffice",c="blue",tsize=12)
b+=box(414,476,340,44,"Optional: job queue (Redis / SQS)",["upload, get a job id, poll for the result"],"purple",dash=True,tsize=12)
b+=T(584,540,"Dashed = not built yet",11,"normal","#555","middle")
b+=h2(40,600,"What to expect")
rows=[("Users","Peak at once","What you need","Status"),
("~100","1 to 3","1 small server (2 GB RAM, 2 CPU)","Ready"),
("~1000","5 to 20","Several servers, load balancer, rate limit, queue","Not built"),
("any","-","Enough CloudConvert credits (costs money per file)","Your account")]
y=640
for i,r in enumerate(rows):
    w="bold" if i==0 else "normal"
    for x,s in zip((40,130,250,640),r): b+=T(x,y,s,12,w,"#1a1a1a" if i==0 else "#444")
    y+=28
b+=h2(40,790,"Why one server is not enough at 1000 users")
for i,s in enumerate(["Each LibreOffice job takes 5 to 10 seconds and 150 to 500 MB of memory.","The server runs 2 at a time (MAX_CONCURRENT). The rest get 503.","With CloudConvert working, most jobs never touch our CPU. The risk is when it fails or credits run out:","then everything lands on LibreOffice at once.","Fix in order: more servers, then a queue, then a rate limit per user."]):
    b+=T(40,822+i*22,s,12)
write("DIAGRAM_SCALING.svg",b)

# ---------- Page 4: data ----------
b=head("Where user data goes","And how long it stays")
b+=box(40,110,160,60,"User's phone",["picks a document"],"gray")
b+=arrow(200,140,284,140,label="HTTPS",ly=132)
b+=box(286,110,170,60,"Our server",["temp file only"],"amber")
b+=arrow(456,128,540,128,label="HTTPS",ly=120)
b+=box(542,110,190,60,"CloudConvert",["third party"],"blue")
b+=arrow(540,154,456,154,dash=True,label="PDF",ly=170)
b+=arrow(286,162,200,162,dash=True)
b+=T(243,180,"PDF",10.5,anchor="middle")
b+=box(286,214,170,46,"LibreOffice",["only if CloudConvert fails"],"green",dash=True)
b+=arrow(371,170,371,212)
b+=box(542,214,190,46,"Hosting provider",["request logs"],"purple")
b+=h2(40,320,"What is stored where")
rows=[("Place","What","How long"),
("Our server temp folder","the document and the PDF","Seconds. Deleted right after, also on errors."),
("CloudConvert","the document and the PDF","We delete the job right after. If that call fails,"),
("","","their own retention applies. Read their terms."),
("Hosting provider logs","IP, time, size, status code","Check your provider. Not the file content."),
("Our database","nothing","We have no database and no user accounts.")]
y=360
for i,r in enumerate(rows):
    w="bold" if i==0 else "normal"
    for x,s in zip((40,250,470),r): b+=T(x,y,s,12 if i else 12,w,"#1a1a1a" if i==0 else "#444")
    y+=26
b+=h2(40,560,"What we promise")
for i,s in enumerate(["We do not read the documents.","We do not sell them or use them for ads.","We do not use them to train AI (our server; see CloudConvert terms for theirs).","We keep no copy on our server after the conversion."]):
    b+=T(40,592+i*22,"-  "+s,12)
b+=h2(40,720,"Must be in the Privacy Policy")
for i,s in enumerate(["Name CloudConvert as a third party that receives the document.","Name the hosting provider and say how long logs are kept.","Tell the user before the first upload: your file is sent to our server and deleted right after.","App Store privacy form: Other User Content, used for app functionality, not tracking.","Details: docs/LEGAL_NOTES.md. Have a lawyer check the final text."]):
    b+=T(40,752+i*22,"-  "+s,12)
write("DIAGRAM_DATA.svg",b)
