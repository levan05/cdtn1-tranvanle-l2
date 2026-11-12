"""Build the editable BT3 Word report using the supplied BT2 PDF as a style reference.

Requires python-docx and PyMuPDF. The original PDF is read-only.
"""
from pathlib import Path
import json
import re
import sys
import tempfile
sys.path.insert(0, str(Path(tempfile.gettempdir()) / 'bt3-doc-tools'))
import pymupdf
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION_START, WD_ORIENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent.parent / 'BT2_2374802010270_TranVanLe (2).pdf'
OUT = DOCS / 'BT3_2374802010270_TranVanLe.docx'
ASSETS = DOCS / 'report-assets'
ASSETS.mkdir(exist_ok=True)
doc = Document()
normal = doc.styles['Normal']
normal.font.name = 'Times New Roman'
normal.font.size = Pt(13)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.first_line_indent = Inches(.39)
for name, size in [('Heading 1',14),('Heading 2',13),('Heading 3',13)]:
    st = doc.styles[name]
    st.font.name = 'Times New Roman'; st.font.size = Pt(size); st.font.bold = True
    st.font.color.rgb = __import__('docx').shared.RGBColor(0,0,0)
    fonts=st.element.rPr.find(qn('w:rFonts'))
    for attr in ['asciiTheme','hAnsiTheme','eastAsiaTheme','cstheme']:
        if fonts is not None: fonts.attrib.pop(qn('w:'+attr),None)
    st.paragraph_format.first_line_indent = Pt(0)
    st.paragraph_format.space_before = Pt(9); st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.keep_with_next = True
for st in doc.styles:
    if st.type == 1 and st.element.rPr is not None:
        fonts = st.element.rPr.find(qn('w:rFonts'))
        if fonts is not None: fonts.set(qn('w:eastAsia'),'Times New Roman')

def setup(section, landscape=False):
    section.orientation = WD_ORIENT.LANDSCAPE if landscape else WD_ORIENT.PORTRAIT
    section.page_width = Inches(11 if landscape else 8.5)
    section.page_height = Inches(8.5 if landscape else 11)
    for side in ['top_margin','bottom_margin','left_margin','right_margin']:
        setattr(section,side, Inches(.65 if landscape else 1))
    section.footer_distance = Inches(.55)
    section.header_distance = Inches(.4)

setup(doc.sections[0])
footer = doc.sections[0].footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.paragraph_format.first_line_indent = Pt(0)
r = footer.add_run(); r.font.name = 'Arial'; r.font.size = Pt(11)
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE')
r._r.addnext(field)

def text(p, s):
    # Keep report links functional in Word, and inline code editable.
    for token in re.split(r'(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)', s):
        match = re.fullmatch(r'\[([^\]]+)\]\(([^)]+)\)', token)
        if match:
            label, target = match.groups()
            if not target.startswith(('https://','http://')):
                target = 'https://github.com/levan05/cdtn1-tranvanle-l2/blob/main/docs/' + target
            link = OxmlElement('w:hyperlink')
            link.set(qn('r:id'), p.part.relate_to(target, RT.HYPERLINK, is_external=True))
            run = OxmlElement('w:r'); props = OxmlElement('w:rPr')
            color = OxmlElement('w:color'); color.set(qn('w:val'),'000000'); props.append(color)
            run.append(props); tx=OxmlElement('w:t'); tx.text=label; run.append(tx); link.append(run); p._p.append(link)
        elif token.startswith('`') and token.endswith('`'):
            run=p.add_run(token[1:-1]); run.font.name='Consolas'; run.font.size=Pt(10)
        elif token.startswith('**') and token.endswith('**'):
            p.add_run(token[2:-2]).bold=True
        else: p.add_run(token)

def para(s='', size=None, indent=True, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p=doc.add_paragraph(); p.alignment=align
    if not indent: p.paragraph_format.first_line_indent=Pt(0)
    text(p,s)
    if size:
        for r in p.runs: r.font.size=Pt(size)
    return p

def heading(s, level=1): return doc.add_paragraph(s, 'Heading '+str(level))
def section(title, landscape=False):
    sec=doc.add_section(WD_SECTION_START.NEW_PAGE); setup(sec,landscape)
    sec.different_first_page_header_footer=False
    heading(title)
    return sec

def table(headers, rows, widths=None, size=11):
    t=doc.add_table(rows=1,cols=len(headers)); t.style='Table Grid'; t.autofit=False
    for i,h in enumerate(headers): text(t.rows[0].cells[i].paragraphs[0],h)
    repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        cells=t.add_row().cells
        for i,value in enumerate(row): text(cells[i].paragraphs[0],str(value))
    for row_index,row in enumerate(t.rows):
        # Avoid splitting a test case or endpoint over pages.
        no_split=OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(no_split)
        for i,c in enumerate(row.cells):
            if widths: c.width=Inches(widths[i])
            for p in c.paragraphs:
                p.paragraph_format.first_line_indent=Pt(0)
                p.paragraph_format.space_after=Pt(3)
                p.paragraph_format.line_spacing=1.05
                p.alignment=WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name='Times New Roman'; r.font.size=Pt(size)
                    if row_index==0: r.bold=True
    if widths:
        for col,w in zip(t.columns,widths): col.width=Inches(w)
    return t

def md_table(s):
    lines=[line for line in s.splitlines() if line.startswith('|')]
    rows=[[c.strip() for c in line.strip().strip('|').split('|')] for line in lines]
    return rows[0], [row for row in rows[1:] if not all(re.fullmatch(r'[-: ]+',c or ' ') for c in row)]

def markdown(s, skip_title=True, base_heading=2):
    lines=s.splitlines(); i=0; in_code=False
    while i<len(lines):
        line=lines[i]
        if line.lstrip().startswith('```'): in_code=not in_code; i+=1; continue
        if in_code:
            p=para('',indent=False); p.paragraph_format.line_spacing=1.0
            p.paragraph_format.space_after=Pt(1)
            r=p.add_run(line); r.font.name='Consolas'; r.font.size=Pt(9)
        elif line.startswith('|'):
            group=[]
            while i<len(lines) and lines[i].startswith('|'): group.append(lines[i]); i+=1
            heads,rows=md_table('\n'.join(group)); table(heads,rows,size=10.5)
            continue
        elif line.startswith('#'):
            level=len(line)-len(line.lstrip('#'))
            if not (level==1 and skip_title): heading(line.lstrip('# ').strip(),min(base_heading+level-2,3))
        elif line.strip(): para(line.lstrip('> '),indent=not line.startswith(('- ','1.','2.','3.','4.','5.')))
        i+=1

def picture(file, caption, width=6.4, crop_bottom=0):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent=Pt(0); p.paragraph_format.space_after=Pt(3)
    shape=p.add_run().add_picture(str(file),width=Inches(width))
    if crop_bottom:
        blipfill=shape._inline.graphic.graphicData.pic.blipFill
        rect=OxmlElement('a:srcRect'); rect.set('b',str(round(crop_bottom*100000)))
        blipfill.insert(1,rect)
        new_height=round(shape.height*(1-crop_bottom))
        shape.height=new_height
        shape._inline.graphic.graphicData.pic.spPr.xfrm.ext.cy=new_height
    c=para(caption,size=11,indent=False,align=WD_ALIGN_PARAGRAPH.CENTER)
    c.paragraph_format.space_after=Pt(8)
    return shape

# Preserve the original cover artwork, while rebuilding every text line as
# editable Word paragraphs. No screenshot of the cover is used as page content.
pdf=pymupdf.open(SOURCE)
page=pdf[0]
for block in page.get_text('dict')['blocks']:
    if block['type']==0:
        for line in block['lines']:
            for span in line['spans']:
                page.add_redact_annot(pymupdf.Rect(span['bbox']),fill=False)
page.apply_redactions(images=0,graphics=0)
background=ASSETS/'bt2-cover-background.png'
page.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False).save(background)
doc.sections[0].different_first_page_header_footer=True
base=doc.sections[0].first_page_header.paragraphs[0]
base.paragraph_format.space_after=Pt(0); base.paragraph_format.line_spacing=Pt(1)
first_footer=doc.sections[0].first_page_footer.paragraphs[0]
first_footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
first_footer.paragraph_format.first_line_indent=Pt(0)
first_field=OxmlElement('w:fldSimple'); first_field.set(qn('w:instr'),'PAGE'); first_footer._p.append(first_field)
shape=base.add_run().add_picture(str(background),width=Inches(8.5),height=Inches(11))
inline=shape._inline
anchor=OxmlElement('wp:anchor')
for k,v in {'distT':'0','distB':'0','distL':'0','distR':'0','simplePos':'0','relativeHeight':'0','behindDoc':'1','locked':'0','layoutInCell':'1','allowOverlap':'1'}.items(): anchor.set(k,v)
simple=OxmlElement('wp:simplePos'); simple.set('x','0'); simple.set('y','0'); anchor.append(simple)
for axis in ['H','V']:
    pos=OxmlElement('wp:position'+axis); pos.set('relativeFrom','page')
    offset=OxmlElement('wp:posOffset'); offset.text='0'; pos.append(offset); anchor.append(pos)
for name in ['extent','effectExtent']:
    element=inline.find(qn('wp:'+name))
    if element is not None: anchor.append(element)
anchor.append(OxmlElement('wp:wrapNone'))
for name in ['docPr','cNvGraphicFramePr']:
    element=inline.find(qn('wp:'+name))
    if element is not None: anchor.append(element)
anchor.append(inline.graphic)
inline.getparent().replace(inline,anchor)

def cover_line(value,x,y,width,size=17,bold=True,italic=False,align=WD_ALIGN_PARAGRAPH.LEFT):
    p=doc.add_paragraph(); p.alignment=align
    fmt=p.paragraph_format; fmt.first_line_indent=Pt(0); fmt.line_spacing=Pt(size*1.18)
    fmt.space_before=Pt(0); fmt.space_after=Pt(0)
    frame=OxmlElement('w:framePr')
    for k,v in {'w':round(width*20),'x':round(x*20),'y':round(y*20),'hAnchor':'page','vAnchor':'page','wrap':'none','hSpace':0,'vSpace':0}.items(): frame.set(qn('w:'+k),str(v))
    p._p.get_or_add_pPr().append(frame)
    r=p.add_run(value); r.font.name='Times New Roman'; r.font.size=Pt(size); r.bold=bold; r.italic=italic
    return p

cover_line('TRƯỜNG ĐẠI HỌC VĂN LANG',175,66,285,17,align=WD_ALIGN_PARAGRAPH.CENTER)
cover_line('KHOA CÔNG NGHỆ THÔNG TIN',175,86,285,17,align=WD_ALIGN_PARAGRAPH.CENTER)
cover_line('MÔN HỌC: CHUYÊN ĐỀ TỐT NGHIỆP 1',110,290,410,20,align=WD_ALIGN_PARAGRAPH.CENTER)
cover_line('Chủ đề : BÀI TẬP 2 - Hiện thực hoá module',105,345,420,20,align=WD_ALIGN_PARAGRAPH.CENTER)
cover_line('cốt lõi',255,372,120,20,align=WD_ALIGN_PARAGRAPH.CENTER)
for label,value,y in [('Sinh viên thực hiện:',' Trần Văn Lễ',438),('MSSV:',' 2374802010270',467),('LỚP :',' 261_71ITGR40203_06',495),('GVHD :',' TS. Nguyễn Trí Hải',524)]:
    p=cover_line(label,116.5,y,395,16)
    r=p.add_run(value); r.bold=False; r.font.name='Times New Roman'; r.font.size=Pt(16 if label!='GVHD :' else 14)

section('MỤC 1. KẾ HOẠCH KIỂM THỬ')
plan_start=len(doc.paragraphs)
para('Hệ thống Mekong Mobile được phát triển theo luồng L2: tiếp nhận và phân loại yêu cầu bảo hành. Bài tập 3 kế thừa mã nguồn của Bài tập 2, tập trung kiểm thử các quy tắc nghiệp vụ, ghi nhận lỗi đã sửa và đóng gói để có thể dựng lại trên môi trường khác.')
table(['Thông tin','Giá trị'],[
    ['Sinh viên / MSSV','Trần Văn Lễ / 2374802010270'],
    ['Lớp / Track','261_71ITGR40203_06 / SE'],
    ['Ngày kiểm thử','12/11/2026'],
    ['Repository','https://github.com/levan05/cdtn1-tranvanle-l2'],
    ['Bản kiểm đóng gói','Git export ca4ce2a; tag v1.0 chưa phát hành'],
], [1.65,4.85],11)
heading('1.1. Phạm vi kiểm thử',2)
para('Kiểm đăng nhập, hồ sơ khách hàng và thiết bị, tạo phiếu kèm log, phân loại sự cố, hạn cam kết, chuyển trạng thái một chiều, quyền truy cập theo trung tâm và khả năng chạy lại migration/seed. Không kiểm tải lớn, xâm nhập bảo mật hoặc giao diện trên nhiều trình duyệt vì chưa thuộc phạm vi prototype.')
heading('1.2. Các tầng kiểm thử',2)
para('Bộ unit gồm 15 test cho hạn cam kết, xử lý lỗi và service phiếu. Bộ báo cáo gồm 12 case: 10 case gọi API Express và PostgreSQL thật, 1 case biên hàm tính hạn, 1 case chạy lại migration/seed. TC-02 kiểm QT-01/02/05/07; TC-04 kiểm QT-03; TC-03/08 kiểm QT-04; TC-10 kiểm QT-06.')
heading('1.3. Tiêu chí thành công',2)
para('15/15 unit test và 12/12 case báo cáo PASS; dữ liệu sai bị từ chối đúng mã HTTP, mã lỗi và nội dung thông báo; mỗi quy tắc QT-01–07 có đường chạy đúng. Không còn lỗi Critical được ghi nhận đang mở; app và DB healthy, dựng bằng không quá hai lệnh sau khi có mã nguồn.')
heading('1.4. Môi trường và dữ liệu',2)
para('Môi trường đóng gói: Windows 11, WSL 3.0.5, Docker Engine 29.9.3, Compose 5.7.0; container Node 20.20.2 và PostgreSQL 16.15. DB kiểm thử riêng baohanh_l2_test được migrate/seed trước khi chạy. Fixture được dọn theo ID; không xóa dữ liệu của DB làm việc. Seed sạch có 2 trung tâm, 6 nhóm sự cố, 2 tài khoản và 3 khách/thiết bị/phiếu/log.')
for p in doc.paragraphs[plan_start:]:
    p.paragraph_format.line_spacing=1.12
    p.paragraph_format.space_after=Pt(4)

# Test report: 8 columns, four cases per landscape page.
heads,case_rows=md_table((DOCS/'test-report.md').read_text(encoding='utf8'))
for index in range(0,12,4):
    section('MỤC 2. BÁO CÁO KẾT QUẢ KIỂM THỬ' if index==0 else 'MỤC 2. BÁO CÁO KẾT QUẢ KIỂM THỬ (TIẾP)',True)
    if index==0:
        para('Kết quả ngày 12/11/2026: 12/12 PASS trong Docker. Các case chạy bằng node scripts/run-workshop-integration.js; có thể thêm mã TC để chạy riêng. Hai case TC-06/07 kiểm cả nội dung thông báo lỗi.',11,False)
    selected=[]
    for source_row in case_rows[index:index+4]:
        row=list(source_row)
        row[2]=f'Chạy runner với {row[0]}; kiểm response và DB theo bước mô tả.'
        row[7]='PASS'
        if row[0]=='TC-12':
            row[1]='DB baohanh_l2_test đã seed; không có tiến trình ghi đồng thời.'
            row[6]='Hai lượt migrate/seed không lỗi. Trước/sau: center 2, category 6, user 2, customer/device/ticket/log đều 3.'
        row=[re.sub(r'`([^`]+)`',r'\1',v) for v in row]
        selected.append(row)
    table(heads,selected,[.65,1.18,1.2,1.1,2.05,.45,2.47,.6],10)
    if index==8:
        para('Tổng hợp: 12 PASS, 0 FAIL. TC-05 kiểm hai phía ranh giới 2000/2001 ký tự; TC-10 kiểm quyền trung tâm; TC-12 kiểm tính tái lập. 15 unit test được thống kê riêng, không cộng vào 12 case trên.',11,False)

section('MỤC 3. NHẬT KÝ LỖI VÀ XÁC NHẬN SỬA LỖI')
para('Ba lỗi dưới đây có bản sửa và kiểm tra trước/sau. Lỗi từ Bài tập 2 được ghi nhận là lỗi lịch sử; phép kiểm tra mất kết nối DB sử dụng lỗi mô phỏng ở error handler. Không coi kết quả mô phỏng là bằng chứng đã tắt PostgreSQL thật.')
bug_source=(DOCS/'bug-log.md').read_text(encoding='utf8')
for n,bug_id in enumerate(['BUG-01','BUG-02','BUG-05'],1):
    block=re.search(r'## '+bug_id+r'[^\n]*\n(.*?)(?=\n## |\nBUG-01/02/05|\Z)',bug_source,re.S)
    title=re.search(r'## ('+bug_id+r'[^\n]*)',bug_source).group(1)
    heading('3.'+str(n)+'. '+title,2)
    for line in block.group(1).strip().splitlines():
        if line.strip(): para(line,size=11.5,indent=False)
heading('3.4. Các bản sửa bổ sung',2)
para('Đóng gói Docker được bổ sung app healthcheck và bộ test trong image (84dfbf5), xác nhận app/db healthy và test PASS. Lockfile cập nhật body-parser (cfdf354); audit backend sau sửa báo 0 vulnerabilities. Các commit BT3 đang lưu local nên link GitHub chỉ truy cập được sau khi push.',size=11.5)

section('MỤC 4. DEPLOYMENT GUIDE')
guide='''## 1. Requirements
Use Linux containers on Docker Desktop with WSL2 (Windows), Docker Desktop (macOS), or Docker Engine (Linux). Target minimum: Engine 24+, Compose v2.20+, 4 GB RAM, 5 GB free disk and port 8000. Internet is required for the initial image download. Node and PostgreSQL are provided in containers.
Verified on 12 November 2026: Windows 11, WSL 3.0.5, Engine 29.9.3, Compose 5.7.0, Node 20.20.2 and PostgreSQL 16.15. The minimum versions are targets, not a tested compatibility matrix.
## 2. Setup
Clone the repository and enter its root. Run these two setup commands:
```sh
cp .env.example .env
docker compose up -d --build
```
The image builds the React frontend; startup runs migrations and seeds automatically before starting Express. Wait for both services to become healthy, then open http://localhost:8000. No separate frontend process is needed.
## 3. Environment variables
| Variable | Purpose and example | Required |
|---|---|---|
| DB_HOST | PostgreSQL host: localhost; Compose supplies db | Native: yes; Compose: supplied |
| DB_PORT | PostgreSQL port: 5432 | Native: yes; Compose: supplied |
| DB_NAME | Database: baohanh_l2 | Native: yes; Compose: supplied |
| DB_USER | Database user: postgres | Native: yes; Compose: supplied |
| DB_PASSWORD | Database password from .env; example doi_mat_khau_cua_ban | Set in .env; demo fallback exists |
| JWT_SECRET | JWT signing key; public demo value in .env.example | Yes; replace outside demo use |
| PORT | App port: 8000 | Optional; Compose fixes 8000 |
| NODE_ENV | Runtime mode: production, set in image | Optional |
| WORKSHOP_ALLOW_DB_WRITE | Set 1 to allow integration fixtures | Integration only |
| WORKSHOP_TEST_PASSWORD | Runner password override, default Demo@123 | Optional |
The example values and seed credentials are public demo configuration. The prototype has no TLS, rate limiting or JWT revocation.
## 4. Sample data
On an empty database, seed creates 2 service centers, 6 issue categories, 2 users, 3 customers, 3 devices, 3 tickets and 3 initial logs. Seeds preserve existing data when rerun. Ticket dates are fixed in October 2026, so overdue flags depend on the clock.
Demo accounts: nv.tiepnhan01 (intake staff) and ql.ninhkieu (manager), password Demo@123; both are in center 1.
## 5. Verify and troubleshoot
```sh
docker compose ps
curl http://localhost:8000/health
docker compose exec app npm test
```
Expected: app and db both healthy; health returns HTTP 200 with {"status":"ok","db":"ok"}; unit tests report 15 pass, 0 fail. Use curl.exe in PowerShell if curl is aliased.
To run the 12 integration cases, use a separate disposable test database:
```sh
docker compose exec db createdb -U postgres baohanh_l2_test
docker compose exec -e DB_NAME=baohanh_l2_test app npm run migrate
docker compose exec -e DB_NAME=baohanh_l2_test app npm run seed
docker compose exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 app node scripts/run-workshop-integration.js
```
Expected SUMMARY 12/12 PASS, 0/12 FAIL. The verification commands above are separate from the two setup commands. Run createdb only once for a new test database; subsequent runs can reuse it after cleanup.
Inspect failures with docker compose logs app db. Free port 8000 if occupied. If a changed .env password differs from an existing volume, restore its original password or reset only the disposable project's volume. Stop with docker compose down; docker compose down -v also deletes this project's database data.
'''
guide_start=len(doc.paragraphs)
markdown(guide)
for p in doc.paragraphs[guide_start:]:
    p.paragraph_format.line_spacing=1.12; p.paragraph_format.space_after=Pt(4)
    if not p.style.name.startswith('Heading'):
        for r in p.runs:
            if r.font.name!='Consolas': r.font.size=Pt(11.5)

section('MỤC 5. CHECKLIST BẢO MẬT',True)
para('Phạm vi đánh giá là prototype cục bộ tại ngày 12/11/2026. Mỗi mục ghi trạng thái theo mức đã hoàn thành và bằng chứng tương ứng; các phần còn thiếu được nêu rõ thay vì đánh dấu đã làm toàn bộ.',11,False)
headers,rows=md_table((DOCS/'checklist-bao-mat.md').read_text(encoding='utf8'))
table(headers,rows,[2.2,1.05,6.45],11)
para('Giới hạn: JWT có thời hạn 8 giờ và chưa thu hồi được; chưa có TLS/rate limit, nhật ký chưa lọc dữ liệu nhạy cảm tập trung. Tài khoản seed chỉ dùng cho demo.',11,False)

# API metadata comes directly from the existing technical documentation.
api=(DOCS/'api-docs.md').read_text(encoding='utf8')
blocks=re.split(r'\n## ',api)[1:]
metadata=[]
for block in blocks:
    name=block.splitlines()[0]
    vals={}
    for i,label in [(1,'purpose'),(2,'auth'),(3,'params'),(4,'success'),(6,'limits')]:
        m=re.search(r'^'+str(i)+r'\. [^:]+: (.+)$',block,re.M)
        vals[label]=m.group(1) if m else ''
    er=re.search(r'\| Endpoint-specific \| (.+?) \|',block)
    vals['errors']=er.group(1) if er else ''
    metadata.append((name,vals))
for start in range(0,len(metadata),7):
    section('MỤC 6. API DOCUMENTATION' if start==0 else 'MỤC 6. API DOCUMENTATION (CONTINUED)',True)
    if start==0:
        para('Base URL: http://localhost:8000. Protected endpoints require Authorization: Bearer <token>. Common errors: 401 UNAUTHENTICATED, 503 DATABASE_UNAVAILABLE and 500 INTERNAL_ERROR. Error body: {error:{code,message,fields}}. The table covers all 20 method/path pairs currently implemented.',11,False)
    rows=[]
    for name,m in metadata[start:start+7]:
        rows.append([name,m['purpose'],m['auth'],m['params'],m['success'],m['errors'],m['limits']])
    table(['Method/path','Business purpose','Authentication','Parameters / JSON body','Success body','Endpoint errors','Limitations'],rows,[1.25,1.3,.65,1.65,1.25,1.55,2.05],9.5)

samples=json.loads((DOCS/'api-examples.json').read_text(encoding='utf8'))['samples']
def excerpt(value):
    if isinstance(value,list): return [excerpt(value[0])] if value else []
    if isinstance(value,dict):
        preferred=['status','db','token','user','ticket_id','ticket_code','priority','category','category_id','due_date','customer_id','device_id','user_id','username','role','center_id','full_name','phone','serial_no','product_name','total','page','size','customers','devices','tickets','users','categories','logs']
        keys=[k for k in preferred if k in value][:5]
        if not keys: keys=list(value)[:4]
        return {k:excerpt(value[k]) for k in keys}
    return value
def compact(value): return json.dumps(value,ensure_ascii=False,separators=(',',':'))
for start in range(0,len(metadata),5):
    section('6.1. ACTUAL REQUEST / RESPONSE EXAMPLES' if start==0 else '6.1. ACTUAL REQUEST / RESPONSE EXAMPLES (CONTINUED)',True)
    if start==0:
        para('Captured from Express/PostgreSQL on 12 November 2026. Response bodies below are selected-field excerpts of real exchanges; list examples show the first item only. JWTs and passwords are redacted. IDs/timestamps belong to that run. Full, unabridged exchanges and all schema details are in docs/api-examples.json and docs/api-docs.md in the repository.',10.5,False)
    rows=[]
    for name,m in metadata[start:start+5]:
        method,url=name.split(' ',1)
        pattern=re.compile('^'+url.replace(':id',r'\d+')+'$')
        actual=next(s for s in samples if s['method']==method and pattern.match(s['path'].split('?')[0]))
        rows.append([method+' '+actual['path'],compact(actual['request']) if actual['request'] else '(no body)',str(actual['status']),compact(excerpt(actual['response'])) if actual['response'] is not None else '(empty body)'])
    table(['Actual request','Request JSON','HTTP','Actual response excerpt'],rows,[2.1,2.8,.5,4.3],10)

shots=DOCS/'packaging-evidence/screenshots'
section('MỤC 7. ẢNH CHỤP MINH CHỨNG',True)
para('Ảnh terminal được chụp trực tiếp khi chạy lệnh Docker ngày 12/11/2026. Các ảnh này là lượt chạy lại trên cùng project kiểm thử đã dựng từ source Git sạch; dữ liệu tạm được dọn sau mỗi lượt. Log của lần dựng đầu tiên được lưu riêng trong repo.',11,False)
picture(shots/'docker-health.png','Hình 7.1. App và PostgreSQL healthy; /health trả status=ok, db=ok.',9.4,.65)
picture(shots/'docker-unit-tests.png','Hình 7.2. Bộ unit test chạy trong container: 15 PASS, 0 FAIL.',9.4,.55)
section('7.1. Kết quả kiểm thử tích hợp',True)
picture(shots/'docker-integration-tests.png','Hình 7.3. Bộ 12 case với PostgreSQL thật chạy trong Docker: 12 PASS, 0 FAIL.',9.6,.29)
section('7.2. Minh chứng quy tắc nghiệp vụ và quyền truy cập',True)
picture(shots/'TC-02-docker.png','Hình 7.4. TC-02: chuẩn hóa/trùng số, che số theo vai trò, serial và tạo phiếu.',9.4,.60)
picture(shots/'TC-10-docker.png','Hình 7.5. TC-10: không đọc được phiếu khác trung tâm; quản lý đọc được phiếu cùng trung tâm.',9.4,.60)
section('7.3. Giao diện và phạm vi kiểm đóng gói')
picture(shots/'frontend-login.png','Hình 7.6. Giao diện đăng nhập được phục vụ từ ứng dụng Docker.',6.3)
para('Bản kiểm đóng gói dùng Git export ca4ce2a, thư mục mới và volume mới. Kết quả: app/db healthy, HTTP / trả 200, unit 15/15 và integration 12/12 PASS. Migration/seed lặp lại giữ nguyên số dòng. Phép thử này chưa bao gồm clone public tag v1.0 vì tag chưa phát hành. Hệ thống hiện là prototype cục bộ, không có bản deploy công khai.')

section('PHỤ LỤC. BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI',True)
ai_start=len(doc.paragraphs)
disclosure=(DOCS/'ai-disclosure.md').read_text(encoding='utf8').split('## Bài tập 3: Kiểm thử và đóng gói',1)[1].split('## Bài tập 2:',1)[0]
markdown(disclosure)
para('Tài liệu đối chiếu: docs/test-plan.md, docs/test-report.md, docs/bug-log.md, docs/deployment-guide.md, docs/checklist-bao-mat.md, docs/api-docs.md, docs/ai-disclosure.md và docs/packaging-evidence/.',11,False)
for p in doc.paragraphs[ai_start:]:
    p.paragraph_format.line_spacing=1.05; p.paragraph_format.space_after=Pt(3)
    for r in p.runs: r.font.size=Pt(10.5)

# Tell Word to update PAGE fields when opened; no TOC is generated.
update=OxmlElement('w:updateFields'); update.set(qn('w:val'),'true'); doc.settings.element.append(update)
doc.core_properties.title='BT3 - Kiem thu va dong goi prototype - Tran Van Le'
doc.core_properties.author='Tran Van Le'
doc.core_properties.subject='Luồng L2 - Mekong Mobile - Track SE'
doc.save(OUT)
print(OUT)
