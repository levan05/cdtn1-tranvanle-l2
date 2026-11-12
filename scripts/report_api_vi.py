"""Vietnamese, portrait-page presentation of the project's real API exchanges."""
import json
import re


def render_api(docs, metadata, section, heading, para, table):
    descriptions=json.loads((docs/'report-assets/api-mo-ta-vi.json').read_text(encoding='utf8'))
    samples=json.loads((docs/'api-examples.json').read_text(encoding='utf8'))['samples']
    assert len(descriptions)==len(metadata)==20

    def excerpt(value):
        if isinstance(value,list): return [excerpt(value[0])] if value else []
        if isinstance(value,dict):
            preferred=['status','db','token','user','ticket_id','ticket_code','priority','category','category_id','due_date','customer_id','device_id','user_id','username','role','center_id','full_name','phone','serial_no','product_name','total','page','size','customers','devices','tickets','users','categories','logs']
            keys=[k for k in preferred if k in value][:5] or list(value)[:4]
            return {k:excerpt(value[k]) for k in keys}
        return value

    def compact(value):
        return json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('<JWT redacted>','<JWT đã che>').replace('<demo password redacted>','<mật khẩu demo đã che>')

    for index,((name,_),description) in enumerate(zip(metadata,descriptions)):
        if index%2==0:
            section('MỤC 6. TÀI LIỆU API' if index==0 else 'MỤC 6. TÀI LIỆU API (TIẾP)')
        if index==0:
            para('Địa chỉ gốc: http://localhost:8000. Các API được bảo vệ yêu cầu tiêu đề Authorization: Bearer <token>. Lỗi chung gồm 401 UNAUTHENTICATED, 503 DATABASE_UNAVAILABLE và 500 INTERNAL_ERROR. Phản hồi lỗi có cấu trúc {error:{code,message,fields}}.',11,False)
            para('Ví dụ lấy từ 21 lượt trao đổi API thật ngày 12/11/2026. Phản hồi trong báo cáo được trích một số trường; danh sách chỉ giữ phần tử đầu. JWT và mật khẩu đã che. Mã định danh và thời gian là giá trị của lượt chạy đó. Dữ liệu đầy đủ nằm ở docs/api-examples.json và docs/api-docs.md trong repo.',10.5,False)
        method,url=name.split(' ',1)
        pattern=re.compile('^'+url.replace(':id',r'\d+')+'$')
        actual=next(s for s in samples if s['method']==method and pattern.match(s['path'].split('?')[0]))
        purpose,auth,params,errors,limits=description
        request=method+' '+actual['path']
        request+='\n'+(compact(actual['request']) if actual['request'] else 'Không có thân yêu cầu.')
        response='HTTP '+str(actual['status'])+'\n'
        response+=compact(excerpt(actual['response'])) if actual['response'] is not None else 'Không có thân phản hồi.'
        heading(f'6.{index+1}. {name}',2)
        table(['Nội dung','Mô tả và ví dụ'],[
            ['Chức năng',purpose],
            ['Xác thực',auth],
            ['Tham số và yêu cầu',params+'\nVí dụ thực tế: '+request],
            ['Phản hồi thành công',response],
            ['Mã lỗi',errors],
            ['Giới hạn',limits],
        ],[1.3,5.39],10.5)
