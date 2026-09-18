(function(){
'use strict';

// การเชื่อมต่อ Supabase: ตั้งค่า URL และ anon key ใน js/config.js
// ถ้ายังไม่ได้ตั้งค่า ระบบจะเข้าสู่โหมดสาธิต (ข้อมูลตัวอย่างในหน่วยความจำ ไม่บันทึก)
const CONFIG=window.APP_CONFIG||{};
const sb=(window.supabase&&CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey&&!/YOUR-PROJECT/i.test(CONFIG.supabaseUrl))
  ?window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey):null;
const COLLECTIONS=['profiles','posts','opportunities','endorsements','meetings','dm','members','requests','events'];
const AVATAR_COLORS=['#176B7A','#8A4B7A','#2F6B8E','#3E7D52','#B0642A','#6E5AA8','#9A5B3C','#4E6E8E'];
function colorFor(id){ let hsh=0; for(const ch of String(id||'')) hsh=(hsh*31+ch.charCodeAt(0))>>>0; return AVATAR_COLORS[hsh%AVATAR_COLORS.length]; }

const TEAMS=['สรรหาและว่าจ้าง','ค่าตอบแทนและสวัสดิการ','พัฒนาบุคลากรและฝึกอบรม','พนักงานสัมพันธ์','HRIS และข้อมูลบุคคล','HR Business Partner'];
const OPP_TYPES=['ตำแหน่งงานภายใน','โครงการพิเศษ','หาพี่เลี้ยง/โค้ช','หลักสูตรอบรม'];
const POST_KINDS={share:'แบ่งปันความรู้',announce:'ประกาศ',kudos:'ชื่นชม',ask:'ขอคำแนะนำ'};
const DAY=86400000, HOUR=3600000, MIN=60000;
const NOW=Date.now();

/* ข้อมูลตัวอย่างสำหรับโหมดสาธิต ใช้เมื่อเปิดไฟล์ตรง ๆ โดยไม่มี runtime ของแพลตฟอร์ม */
const demoData={
  profiles:{
    'sample-arisa':{sample:true,sampleName:'อริสา วงศ์สุวรรณ',color:'#8A4B7A',title:'ผู้จัดการฝ่ายสรรหาและว่าจ้าง',team:'สรรหาและว่าจ้าง',location:'สำนักงานใหญ่',bio:'ดูแลการสรรหานักบิน ลูกเรือ และพนักงานภาคพื้นทั้งหมด สนใจเรื่อง employer branding และการคัดเลือกด้วยแบบประเมินเชิงพฤติกรรม',skills:['สรรหาลูกเรือ','สัมภาษณ์เชิงพฤติกรรม','Employer Branding','การเจรจาข้อเสนอ','LinkedIn Recruiter'],experience:[{role:'ผู้จัดการฝ่ายสรรหาและว่าจ้าง',org:'Pattaya Aviation',from:'2565',to:'ปัจจุบัน',desc:'รับผิดชอบแผนสรรหาประจำปี ทีมงาน 6 คน'},{role:'Senior Recruiter',org:'สายการบินระดับภูมิภาค',from:'2560',to:'2565',desc:'สรรหาลูกเรือกว่า 300 อัตราต่อปี'}],certs:[{name:'Certified Talent Acquisition Specialist',issuer:'HRCI',year:'2566'}],following:['sample-preeda','sample-thanakorn'],updatedAt:NOW-40*DAY},
    'sample-thanakorn':{sample:true,sampleName:'ธนกร ศรีสมบูรณ์',color:'#2F6B8E',title:'HR Business Partner ฝ่ายปฏิบัติการบิน',team:'HR Business Partner',location:'สำนักงานใหญ่',bio:'คู่คิดด้านคนให้ฝ่ายปฏิบัติการบิน ตั้งแต่อัตรากำลัง การประเมินผล ไปจนถึงข้อพิพาท',skills:['Workforce Planning','การจัดการผลงาน','กฎหมายแรงงาน','นโยบายตารางบินลูกเรือ','Change Management'],experience:[{role:'HR Business Partner',org:'Pattaya Aviation',from:'2564',to:'ปัจจุบัน',desc:''},{role:'HR Generalist',org:'บริษัทโลจิสติกส์',from:'2559',to:'2564',desc:''}],certs:[{name:'SHRM-CP',issuer:'SHRM',year:'2565'}],following:['sample-arisa','sample-nattha','sample-preeda'],updatedAt:NOW-12*DAY},
    'sample-preeda':{sample:true,sampleName:'ปรีดา จันทร์เพ็ญ',color:'#3E7D52',title:'หัวหน้าฝึกอบรมและพัฒนาบุคลากร',team:'พัฒนาบุคลากรและฝึกอบรม',location:'ศูนย์ฝึกอบรม',bio:'ออกแบบหลักสูตรสำหรับลูกเรือและพนักงานภาคพื้น เน้น safety culture และ CRM',skills:['ออกแบบหลักสูตร','CRM Training','Safety Culture','LMS Administration','การประเมิน 360 องศา'],experience:[{role:'หัวหน้าฝึกอบรม',org:'Pattaya Aviation',from:'2562',to:'ปัจจุบัน',desc:'ดูแลหลักสูตรบังคับตามข้อกำหนด CAAT และหลักสูตรพัฒนาผู้นำ'},{role:'Cabin Crew Instructor',org:'สายการบินระดับภูมิภาค',from:'2555',to:'2562',desc:''}],certs:[{name:'Train the Trainer',issuer:'CAAT',year:'2564'},{name:'CRM Facilitator',issuer:'IATA',year:'2563'}],following:['sample-thanakorn'],updatedAt:NOW-5*DAY},
    'sample-nattha':{sample:true,sampleName:'ณัฐฐา พงษ์พานิช',color:'#B0642A',title:'เจ้าหน้าที่ HRIS และข้อมูลบุคคล',team:'HRIS และข้อมูลบุคคล',location:'สำนักงานใหญ่',bio:'ดูแลระบบ SuccessFactors และรายงานข้อมูลบุคคลให้ผู้บริหาร ถนัด Power BI',skills:['SAP SuccessFactors','Power BI','People Analytics','PDPA','ข้อมูลเงินเดือน'],experience:[{role:'เจ้าหน้าที่ HRIS',org:'Pattaya Aviation',from:'2566',to:'ปัจจุบัน',desc:''}],certs:[{name:'PDPA Data Protection Officer',issuer:'สคส.',year:'2566'}],following:['sample-thanakorn','sample-warin'],updatedAt:NOW-2*DAY},
    'sample-warin':{sample:true,sampleName:'วรินทร์ บุญมี',color:'#6E5AA8',title:'เจ้าหน้าที่พนักงานสัมพันธ์',team:'พนักงานสัมพันธ์',location:'สำนักงานใหญ่',bio:'จัดกิจกรรมพนักงานและดูแลเรื่องร้องเรียนภายใน',skills:['การไกล่เกลี่ยข้อพิพาท','กิจกรรมพนักงาน','Engagement Survey','สวัสดิการ'],experience:[{role:'เจ้าหน้าที่พนักงานสัมพันธ์',org:'Pattaya Aviation',from:'2567',to:'ปัจจุบัน',desc:''}],certs:[],following:['sample-nattha'],updatedAt:NOW-1*DAY}
  },
  posts:{
    'p_s1':{sample:true,authorId:'sample-preeda',kind:'share',createdAt:NOW-3*HOUR,text:'สรุปจากงาน CAAT Safety Culture Workshop สัปดาห์ที่แล้ว มี 3 ประเด็นที่น่าปรับใช้กับหลักสูตร CRM รุ่นถัดไป\n1) เพิ่มกรณีศึกษาจากเหตุการณ์จริงในภูมิภาค\n2) ให้ลูกเรือทำ debrief ร่วมกับนักบินทุกรุ่น\n3) วัดผลด้วยแบบสังเกตพฤติกรรม ไม่ใช่ข้อสอบอย่างเดียว\nใครสนใจร่างหลักสูตรด้วยกันทักมาได้ครับ',likes:['sample-arisa','sample-thanakorn','sample-nattha'],comments:[{authorId:'sample-thanakorn',createdAt:NOW-2*HOUR,text:'ข้อ 2 น่าสนใจมาก ฝั่งปฏิบัติการบินน่าจะสนับสนุน เดี๋ยวช่วยประสานให้ครับ'}]},
    'p_s2':{sample:true,authorId:'sample-arisa',kind:'announce',createdAt:NOW-8*HOUR,text:'เปิดรับสมัคร Cabin Crew รุ่น 12 แล้ววันนี้ ปิดรับ 30 ก.ย. ทีมสรรหาต้องการอาสาสมัครช่วยคัดกรองใบสมัครรอบแรกประมาณ 400 ใบ ใครว่างช่วงบ่ายวันพุธถึงศุกร์ ลงชื่อในบอร์ดโอกาสได้เลยค่ะ',likes:['sample-warin','sample-preeda'],comments:[]},
    'p_s3':{sample:true,authorId:'sample-nattha',kind:'share',createdAt:NOW-1*DAY,text:'Dashboard อัตราการลาออกรายไตรมาสเวอร์ชันใหม่ขึ้นบน Power BI แล้ว แยกดูตามฝ่ายและตำแหน่งได้ ถ้าเห็นตัวเลขแปลกๆ แจ้งได้เลย ตอนนี้ดึงข้อมูลจาก SuccessFactors ทุกเที่ยงคืน',likes:['sample-thanakorn'],comments:[{authorId:'sample-thanakorn',createdAt:NOW-20*HOUR,text:'ขอเพิ่มตัวกรองตามฐานประจำการด้วยได้ไหมครับ'},{authorId:'sample-nattha',createdAt:NOW-19*HOUR,text:'ได้ค่ะ ใส่ให้ในรอบถัดไป'}]},
    'p_s4':{sample:true,authorId:'sample-warin',kind:'kudos',createdAt:NOW-2*DAY,text:'ขอบคุณทีม HRIS ที่ช่วยเตรียมรายชื่อวันเกิดพนักงานประจำเดือนได้ทันเวลา งาน Engagement เดือนนี้ผ่านไปด้วยดี พนักงานภาคพื้นมาร่วมกว่า 120 คน',likes:['sample-nattha','sample-arisa','sample-preeda','sample-thanakorn'],comments:[]},
    'p_s5':{sample:true,authorId:'sample-thanakorn',kind:'ask',createdAt:NOW-3*DAY,text:'ใครเคยทำ workforce planning สำหรับช่วง peak season (พ.ย. ถึง ม.ค.) บ้าง อยากขอดูตัวอย่างโมเดลคำนวณอัตรากำลังลูกเรือต่อเที่ยวบิน กำลังเตรียมเสนอผู้บริหารปลายเดือนนี้',likes:[],comments:[{authorId:'sample-arisa',createdAt:NOW-3*DAY+HOUR,text:'มีของปีที่แล้วอยู่ค่ะ เดี๋ยวแชร์ไฟล์ให้ทาง SharePoint'}]}
  },
  opportunities:{
    'o_s1':{sample:true,title:'อาสาสมัครคัดกรองใบสมัคร Cabin Crew รุ่น 12',type:'โครงการพิเศษ',team:'สรรหาและว่าจ้าง',postedBy:'sample-arisa',createdAt:NOW-8*HOUR,deadline:NOW+9*DAY,status:'open',description:'ช่วยคัดกรองใบสมัครรอบแรกตามเกณฑ์ที่กำหนด (คุณสมบัติพื้นฐาน ภาษา ส่วนสูง) ใช้เวลาประมาณ 3 ช่วงบ่าย มีคู่มือเกณฑ์ให้ก่อนเริ่ม',interested:['sample-warin']},
    'o_s2':{sample:true,title:'Senior HR Business Partner (ฝ่ายซ่อมบำรุงอากาศยาน)',type:'ตำแหน่งงานภายใน',team:'HR Business Partner',postedBy:'sample-thanakorn',createdAt:NOW-2*DAY,deadline:NOW+20*DAY,status:'open',description:'เปิดรับโอนย้ายภายใน ดูแลพนักงานฝ่ายซ่อมบำรุงประมาณ 180 คน ต้องการประสบการณ์ HRBP หรือ HR Generalist 3 ปีขึ้นไป และเข้าใจข้อกำหนดใบอนุญาตช่างอากาศยาน',interested:[]},
    'o_s3':{sample:true,title:'พี่เลี้ยงด้าน People Analytics',type:'หาพี่เลี้ยง/โค้ช',team:'HRIS และข้อมูลบุคคล',postedBy:'sample-nattha',createdAt:NOW-1*DAY,deadline:NOW+30*DAY,status:'open',description:'รับ 2 คนที่อยากเริ่มทำรายงานและ dashboard ด้วยตัวเอง นัดคุยสัปดาห์ละ 1 ชั่วโมง เป็นเวลา 8 สัปดาห์',interested:['sample-warin','sample-arisa']},
    'o_s4':{sample:true,title:'หลักสูตร Train the Trainer รุ่น 5 (CAAT)',type:'หลักสูตรอบรม',team:'พัฒนาบุคลากรและฝึกอบรม',postedBy:'sample-preeda',createdAt:NOW-4*DAY,deadline:NOW+5*DAY,status:'open',description:'อบรม 3 วันที่ศูนย์ฝึกอบรม เหมาะกับคนที่ต้องเป็นวิทยากรภายใน มีที่นั่งจากฝ่าย HR 2 ที่',interested:['sample-thanakorn']}
  },
  endorsements:{
    'sample-preeda':{bySkill:{'ออกแบบหลักสูตร':['sample-arisa','sample-thanakorn'],'Safety Culture':['sample-thanakorn']}},
    'sample-arisa':{bySkill:{'สัมภาษณ์เชิงพฤติกรรม':['sample-preeda','sample-warin','sample-nattha']}},
    'sample-nattha':{bySkill:{'Power BI':['sample-thanakorn','sample-warin'],'PDPA':['sample-arisa']}}
  },
  meetings:{
    'm_s1':{sample:true,title:'ประชุมทีมสรรหาประจำสัปดาห์',agenda:'1) ความคืบหน้า Cabin Crew รุ่น 12\n2) แผนสัมภาษณ์นักบินฝึกหัด\n3) ปัญหาระบบรับสมัครออนไลน์',startAt:at(1,10,0),durationMin:45,hostId:'sample-arisa',invitees:['sample-thanakorn','sample-warin'],responses:{'sample-thanakorn':'accept'},open:true,link:'',status:'scheduled',notes:'',createdAt:NOW-2*DAY},
    'm_s2':{sample:true,title:'เตรียมงาน Onboarding พนักงานใหม่เดือน ต.ค.',agenda:'ยืนยันกำหนดการ 3 วัน วิทยากรแต่ละช่วง และชุดเอกสาร PDPA สำหรับพนักงานใหม่',startAt:at(3,14,0),durationMin:60,hostId:'sample-preeda',invitees:['sample-arisa','sample-nattha','sample-warin'],responses:{'sample-arisa':'accept','sample-nattha':'maybe'},open:true,link:'',status:'scheduled',notes:'',createdAt:NOW-1*DAY},
    'm_s3':{sample:true,title:'ทบทวน Dashboard อัตราการลาออก Q3',agenda:'ตรวจสอบตัวเลขรายฝ่ายก่อนส่งผู้บริหาร',startAt:at(-2,15,30),durationMin:30,hostId:'sample-nattha',invitees:['sample-thanakorn'],responses:{'sample-thanakorn':'accept'},open:false,link:'',status:'ended',notes:'สรุปการประชุม\n- เพิ่มตัวกรองฐานประจำการในรอบถัดไป\n- ตัวเลขฝ่ายซ่อมบำรุงสูงผิดปกติ ธนกรตรวจสอบกับหัวหน้าฝ่ายก่อนส่งรายงาน\n\nงานที่ต้องทำ\n- ณัฐฐา: เพิ่มตัวกรองฐานประจำการ (ภายใน 2 สัปดาห์)\n- ธนกร: ทบทวน exit interview ย้อนหลัง 5 ราย',createdAt:NOW-4*DAY},
    'm_s4':{sample:true,title:'ซ้อมนำเสนอแผนอัตรากำลัง Q4',agenda:'ซ้อมสไลด์ 15 นาที และรับข้อเสนอแนะก่อนเสนอผู้บริหาร',startAt:at(2,11,0),durationMin:30,hostId:'sample-thanakorn',invitees:['demo-me','sample-arisa'],responses:{},open:false,link:'',status:'scheduled',notes:'',createdAt:NOW-90*MIN}
  },
  dm:{
    'demo-me__sample-arisa':{parts:['demo-me','sample-arisa'],lastAt:NOW-25*MIN,lastFrom:'sample-arisa',seen:{'demo-me':NOW-3*HOUR+5*MIN},createdAt:NOW-2*DAY,msgs:[
      {f:'sample-arisa',t:NOW-2*DAY+HOUR,sys:'call',kind:'audio',status:'ended',dur:312},
      {f:'demo-me',t:NOW-3*HOUR-10*MIN,plain:true,text:'พี่อริสา ขอไฟล์เกณฑ์คัดกรอง Cabin Crew รุ่น 12 หน่อยครับ'},
      {f:'sample-arisa',t:NOW-3*HOUR,plain:true,text:'ได้เลย เดี๋ยวส่งให้ทาง SharePoint นะคะ'},
      {f:'sample-arisa',t:NOW-25*MIN,plain:true,text:'ส่งแล้วค่ะ ลองเปิดดูแล้วบอกด้วยว่าเห็นไหม'}]},
    'demo-me__sample-nattha':{parts:['demo-me','sample-nattha'],lastAt:NOW-40*MIN,lastFrom:'sample-nattha',seen:{'demo-me':NOW-DAY},createdAt:NOW-DAY,msgs:[
      {f:'sample-nattha',t:NOW-40*MIN,plain:true,text:'Dashboard ตัวใหม่ขึ้นแล้วนะคะ ช่วยเช็กตัวเลขฝ่ายซ่อมบำรุงให้หน่อย'}]}
  }
};
demoData.posts['p_s6']={sample:true,authorId:'demo-me',kind:'ask',createdAt:NOW-5*HOUR,text:'ขอความเห็นเรื่องรูปแบบวันแรกของ Onboarding พนักงานใหม่เดือน ต.ค. ควรเริ่มด้วย safety briefing หรือพาเดินดูสถานที่ก่อนดี',likes:['sample-arisa','sample-warin'],likedAt:{'sample-arisa':NOW-4*HOUR,'sample-warin':NOW-2*HOUR},comments:[{authorId:'sample-preeda',createdAt:NOW-3*HOUR,text:'แนะนำ safety briefing ก่อนเลยครับ เป็นข้อกำหนดของ CAAT ด้วย แล้วค่อยพาเดินดูสถานที่ช่วงบ่าย'}]};
demoData.endorsements['demo-me']={bySkill:{'การประสานงาน':['sample-warin']},at:{'การประสานงาน':{'sample-warin':NOW-50*MIN}}};
demoData.profiles['sample-kanok']={sample:true,sampleName:'กนกวรรณ แซ่ลิ้ม',color:'#9A5B3C',title:'เจ้าหน้าที่สรรหา',team:'สรรหาและว่าจ้าง',location:'สำนักงานใหญ่',bio:'',skills:[],experience:[],certs:[],following:[],updatedAt:NOW-2*HOUR};
demoData.members={
  'demo-me':{status:'approved',employeeId:'PA-00001',team:'HR Business Partner',title:'ผู้ดูแลระบบ',requestedAt:NOW-10*DAY,approvedAt:NOW-10*DAY,approvedBy:'demo-me'},
  'sample-arisa':{status:'approved',employeeId:'PA-01021',team:'สรรหาและว่าจ้าง',title:'ผู้จัดการฝ่ายสรรหาและว่าจ้าง',requestedAt:NOW-9*DAY,approvedAt:NOW-9*DAY,approvedBy:'demo-me'},
  'sample-thanakorn':{status:'approved',employeeId:'PA-01377',team:'HR Business Partner',title:'HR Business Partner ฝ่ายปฏิบัติการบิน',requestedAt:NOW-9*DAY,approvedAt:NOW-9*DAY,approvedBy:'demo-me'},
  'sample-preeda':{status:'approved',employeeId:'PA-00842',team:'พัฒนาบุคลากรและฝึกอบรม',title:'หัวหน้าฝึกอบรมและพัฒนาบุคลากร',requestedAt:NOW-8*DAY,approvedAt:NOW-8*DAY,approvedBy:'demo-me'},
  'sample-nattha':{status:'approved',employeeId:'PA-02210',team:'HRIS และข้อมูลบุคคล',title:'เจ้าหน้าที่ HRIS และข้อมูลบุคคล',requestedAt:NOW-7*DAY,approvedAt:NOW-7*DAY,approvedBy:'demo-me'},
  'sample-warin':{status:'approved',employeeId:'PA-02498',team:'พนักงานสัมพันธ์',title:'เจ้าหน้าที่พนักงานสัมพันธ์',requestedAt:NOW-6*DAY,approvedAt:NOW-6*DAY,approvedBy:'demo-me'}
};
demoData.requests={
  'sample-kanok':{employeeId:'PA-02733',team:'สรรหาและว่าจ้าง',title:'เจ้าหน้าที่สรรหา',note:'ย้ายมาจากฝ่ายบริการภาคพื้น เริ่มงานที่ HR วันที่ 1 ต.ค.',requestedAt:NOW-2*HOUR}
};
demoData.events={
  'ev_s1':{sample:true,title:'ปฐมนิเทศพนักงานใหม่ รุ่น ต.ค.',type:'activity',allDay:true,startAt:at(14,0,0),endAt:at(16,0,0),location:'ศูนย์ฝึกอบรม',description:'กำหนดการ 3 วัน: วันแรก safety briefing, วันที่สอง ระบบงานและสวัสดิการ, วันที่สาม เยี่ยมชมฐานปฏิบัติการ',createdBy:'sample-preeda',createdAt:NOW-3*DAY,going:['sample-arisa','sample-warin']},
  'ev_s2':{sample:true,title:'อบรม Train the Trainer รุ่น 5',type:'training',allDay:true,startAt:at(9,0,0),endAt:at(11,0,0),location:'ศูนย์ฝึกอบรม',description:'อบรม 3 วัน ผู้เข้าอบรมจากฝ่าย HR 2 ที่นั่ง',createdBy:'sample-preeda',createdAt:NOW-5*DAY,going:['sample-thanakorn']},
  'ev_s3':{sample:true,title:'งานเลี้ยงวันเกิดพนักงานประจำเดือน',type:'activity',allDay:false,startAt:at(6,15,0),endAt:at(6,16,30),location:'โถงชั้น 2 สำนักงานใหญ่',description:'ขนมและเครื่องดื่ม พนักงานภาคพื้นเข้าร่วมได้ทุกคน',createdBy:'sample-warin',createdAt:NOW-2*DAY,going:['sample-nattha','sample-thanakorn']},
  'ev_s4':{sample:true,title:'ส่งแผนอัตรากำลัง Q4 ให้ผู้บริหาร',type:'deadline',allDay:true,startAt:at(12,0,0),endAt:at(12,0,0),location:'',description:'ส่งไฟล์ให้เลขาผู้บริหารก่อน 12:00',createdBy:'sample-thanakorn',createdAt:NOW-DAY,going:[]},
  'ev_s5':{sample:true,title:'วันนวมินทรมหาราช (วันหยุดบริษัท)',type:'holiday',allDay:true,startAt:new Date(2026,9,13).getTime(),endAt:new Date(2026,9,13).getTime(),location:'',description:'',createdBy:'sample-warin',createdAt:NOW-10*DAY,going:[]},
  'ev_s6':{sample:true,title:'Engagement Survey ประจำปี เปิดให้ตอบ',type:'other',allDay:true,startAt:at(3,0,0),endAt:at(17,0,0),location:'',description:'ส่งลิงก์แบบสำรวจให้พนักงานทุกคนทางระบบ HRIS',createdBy:'sample-warin',createdAt:NOW-DAY,going:[]}
};
function at(dayOffset,hour,minute){ const d=new Date(NOW+dayOffset*DAY); d.setHours(hour,minute,0,0); return d.getTime(); }

const state={
  status:'connecting', live:false, db:null, user:null,
  me:{id:'demo-me',name:'คุณ (สาธิต)',avatarUrl:'',color:'#176B7A'},
  canWrite:true, canEdit:false,
  view:'feed', profileId:null, roomId:null, room:null,
  dm:{ready:false,priv:null,pub:null,derived:new Map(),cache:new Map(),prefs:{},loaded:false},
  auth:{signedIn:false,busy:false,recovery:false}, session:null, priv:{}, dataLoaded:false, changes:null,
  data:{profiles:{},posts:{},opportunities:{},endorsements:{},meetings:{},dm:{},members:{},requests:{},events:{}}
};
const ui={composer:'',composerKind:'share',dirQ:'',dirTeam:'',expandedOpp:null,showOppForm:false,oppForm:null,edit:null,commentDraft:{},showMeetForm:false,meetForm:null,roomTab:'people',chatDraft:'',notesEdit:null,linkEdit:false,panel:null,chatWith:null,dmDraft:'',dmSearch:'',notifMark:0,scrollToPost:null,authErr:'',authMode:'login',authForm:{email:'',password:'',password2:'',name:''},regForm:null,rejectNote:{},calMonth:null,calDay:null,showEventForm:false,eventForm:null,expandedEvent:null};

/* ---------- helpers ---------- */
function h(tag,attrs,...kids){
  const el=document.createElement(tag);
  if(attrs) for(const [k,v] of Object.entries(attrs)){
    if(v==null||v===false) continue;
    if(k==='class') el.className=v;
    else if(k.startsWith('on')) el.addEventListener(k.slice(2),v);
    else if(k==='svg') el.innerHTML=v;
    else el.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat(Infinity)){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(String(c))); }
  return el;
}
const ICON={
  plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 16.5 21 10.2c1.2-.4 1.2-2 0-2.4L12.5 5 9 7.5l5 2.3-6.8 2.4-3.7-1.6-1.5 1.2 3.4 2.4-.9 3.7Z"/></svg>',
  like:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-7a2.3 2.3 0 0 1 2.3 2.3V10h5.2a2 2 0 0 1 2 2.3l-1.1 6.3A2 2 0 0 1 17.4 20H7"/></svg>',
  comment:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>',
  msg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5C6.5 2.5 2.2 6.6 2.2 11.7c0 2.9 1.4 5.5 3.6 7.2v3.6l3.4-1.9c.9.3 1.8.4 2.8.4 5.5 0 9.8-4.1 9.8-9.3S17.5 2.5 12 2.5Zm1 12.4-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7Z"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5a6 6 0 0 1 12 0v4.3l1.6 2.7c.4.7-.1 1.5-.9 1.5H5.3c-.8 0-1.3-.8-.9-1.5L6 12.8V8.5Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"/></svg>',
  video:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h11a2 2 0 0 1 2 2v1.5l4-2.5v10l-4-2.5V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/></svg>',
  camoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v.5a1.5 1.5 0 0 1-1.5 1.5H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1M9 6h6a2 2 0 0 1 2 2v1.5l4-2.5v8"/><path d="M3 3l18 18"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  micoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9.5V6a3 3 0 0 1 6 0v5a3 3 0 0 1-.6 1.8M5 11a7 7 0 0 0 10.6 6M19 11a7 7 0 0 1-.8 3.3M12 18v3"/><path d="M3 3l18 18"/></svg>'
};
function svg(name,size){ return h('span',{svg:ICON[name],style:`display:inline-flex;width:${size||16}px;height:${size||16}px;vertical-align:-3px`}); }
function initials(name){ return (name||'?').trim().split(/\s+/).slice(0,2).map(w=>Array.from(w)[0]).join(''); }
function avatar(p,size){
  const el=h('span',{class:'avatar',style:`--sz:${size||40}px;background:${p.color||'#6b7b86'}`});
  if(p.avatarUrl) el.append(h('img',{src:p.avatarUrl,alt:''})); else el.append(initials(p.name));
  return el;
}
function ago(ts){
  const d=Date.now()-ts;
  if(d<MIN) return 'เมื่อสักครู่';
  if(d<HOUR) return Math.floor(d/MIN)+' นาทีที่แล้ว';
  if(d<DAY) return Math.floor(d/HOUR)+' ชั่วโมงที่แล้ว';
  if(d<7*DAY) return Math.floor(d/DAY)+' วันที่แล้ว';
  return fmtDate(ts);
}
function fmtDate(ts){ return new Date(ts).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}); }
function fmtBoard(ts){ return new Date(ts).toLocaleDateString('th-TH',{day:'2-digit',month:'short'}); }
function daysLeft(ts){ return Math.ceil((ts-Date.now())/DAY); }
function newId(p){ return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function myProfile(){ return state.me.id?state.data.profiles[state.me.id]:null; }
function isFollowing(id){ const p=myProfile(); return !!(p&&Array.isArray(p.following)&&p.following.includes(id)); }
function profileOf(id){ return state.data.profiles[id]||null; }
function endorseCount(id,skill){ const e=state.data.endorsements[id]; const a=e&&e.bySkill&&e.bySkill[skill]; return Array.isArray(a)?a.length:0; }
function endorsedByMe(id,skill){ const e=state.data.endorsements[id]; const a=e&&e.bySkill&&e.bySkill[skill]; return Array.isArray(a)&&a.includes(state.me.id); }
function completeness(p){
  if(!p) return 0; let n=0;
  if(p.title) n++; if(p.team) n++; if(p.bio) n++;
  if(Array.isArray(p.skills)&&p.skills.length>=3) n++;
  if(Array.isArray(p.experience)&&p.experience.length) n++;
  if(Array.isArray(p.certs)&&p.certs.length) n++;
  return Math.round(n/6*100);
}
let toastTimer=null;
function toast(msg){
  let t=document.querySelector('.toast'); if(!t){ t=h('div',{class:'toast',role:'status'}); document.body.append(t); }
  t.textContent=msg; clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.remove(),3800);
}
function msgFor(e){
  const c=e&&e.code;
  if(c==='invalid_argument') return 'บันทึกไม่ได้ คุณอาจมีสิทธิ์ดูอย่างเดียว';
  if(c==='quota_exceeded') return 'พื้นที่เก็บข้อมูลเต็ม ลบโพสต์หรือประกาศเก่าออกก่อน';
  if(c==='resource_exhausted') return 'ส่งคำขอถี่เกินไป รอสักครู่แล้วลองใหม่';
  if(c==='revoked') return 'สิทธิ์เข้าถึงข้อมูลถูกยกเลิก โหลดหน้าใหม่';
  return 'เกิดข้อผิดพลาด ลองอีกครั้ง';
}
async function guarded(fn){ try{ await fn(); return true; }catch(e){ console.error(e); toast(msgFor(e)); return false; } }

/* ---------- store ---------- */
// เอกสารทุกชนิดเก็บในตาราง docs (collection, id, data jsonb) ดู supabase/schema.sql
function dbErr(e){
  const msg=(e&&e.message)||'';
  const code=(e&&e.code==='42501')||/policy|permission|row-level/i.test(msg)?'invalid_argument':/quota|limit/i.test(msg)?'quota_exceeded':'unavailable';
  return {code,message:msg};
}
function deepMerge(target,patch){
  for(const [k,v] of Object.entries(patch)){
    if(v&&typeof v==='object'&&!Array.isArray(v)&&target[k]&&typeof target[k]==='object'&&!Array.isArray(target[k])) deepMerge(target[k],v);
    else target[k]=v;
  }
  return target;
}
async function setDoc(coll,id,body){
  if(!state.live){ state.data[coll][id]=clone(body); render(); return; }
  const {error}=await sb.from('docs').upsert({collection:coll,id,data:body},{onConflict:'collection,id'});
  if(error) throw dbErr(error);
  if(!state.data[coll]) state.data[coll]={};
  state.data[coll][id]=clone(body); render();
}
async function delDoc(coll,id){
  if(!state.live){ delete state.data[coll][id]; render(); return; }
  const {error}=await sb.from('docs').delete().match({collection:coll,id});
  if(error) throw dbErr(error);
  if(state.data[coll]) delete state.data[coll][id];
  render();
}
function privKind(id){ const i=String(id).indexOf('_'); return i>=0?id.slice(i+1):id; }
async function privateGet(kind){
  if(state.priv[kind]) return state.priv[kind];
  const {data,error}=await sb.from('docs').select('data').match({collection:'private',id:state.me.id+'_'+kind}).maybeSingle();
  if(error) throw dbErr(error);
  return data?data.data:null;
}
async function privateSet(kind,body){
  const {error}=await sb.from('docs').upsert({collection:'private',id:state.me.id+'_'+kind,data:body,owner:state.me.id},{onConflict:'collection,id'});
  if(error) throw dbErr(error);
  state.priv[kind]=body;
}
function refreshRole(){
  const mm=state.data.members&&state.data.members[state.me.id];
  state.canEdit=!!(mm&&mm.status==='approved'&&mm.role==='admin');
  state.canWrite=true;
}
function dmChanged(id,prev,c){
  const me=state.me.id; if(!c||c.lastFrom===me) return;
  if(!(c.lastAt>((prev&&prev.lastAt)||0))) return;
  const other=otherOf(c);
  if(ui.chatWith===other) markSeen(id); else notifyNewDM(other);
}
function onDocChange(payload){
  const row=payload.eventType==='DELETE'?payload.old:payload.new;
  if(!row||!row.collection) return;
  const coll=row.collection, id=row.id;
  if(coll==='private'){
    if(payload.eventType!=='DELETE'&&row.owner===state.me.id){ state.priv[privKind(id)]=row.data; if(privKind(id)==='prefs') state.dm.prefs=row.data||{}; render(); }
    return;
  }
  if(payload.eventType==='DELETE'){ if(state.data[coll]) delete state.data[coll][id]; if(coll==='members') refreshRole(); render(); return; }
  const prev=state.data[coll]?state.data[coll][id]:undefined;
  if(!state.data[coll]) state.data[coll]={};
  state.data[coll][id]=row.data;
  if(coll==='dm') dmChanged(id,prev,row.data);
  if(coll==='members') refreshRole();
  if(coll==='profiles'&&id===state.me.id&&row.data&&row.data.name) state.me.name=row.data.name;
  render();
}
async function subscribe(){
  const {data,error}=await sb.from('docs').select('collection,id,data,owner');
  if(error){ console.error(error); toast('โหลดข้อมูลไม่สำเร็จ: '+error.message); return; }
  const m={}; for(const c of COLLECTIONS) m[c]={};
  for(const row of data||[]){
    if(row.collection==='private'){ if(row.owner===state.me.id) state.priv[privKind(row.id)]=row.data; continue; }
    if(!m[row.collection]) m[row.collection]={};
    m[row.collection][row.id]=row.data;
  }
  state.data=m; state.dm.prefs=state.priv.prefs||{}; state.dm.loaded=true; state.dataLoaded=true;
  refreshRole();
  const mine=m.profiles[state.me.id]; if(mine&&mine.name) state.me.name=mine.name;
  if(state.profilesLoaded) state.profilesLoaded();
  render();
  if(state.changes) sb.removeChannel(state.changes);
  state.changes=sb.channel('docs-changes').on('postgres_changes',{event:'*',schema:'public',table:'docs'},onDocChange).subscribe();
}

/* ---------- people ---------- */
async function people(ids){
  const out={};
  for(const id of new Set(ids)){
    if(!id) continue;
    const p=state.data.profiles[id];
    if(p&&p.sample) out[id]={name:p.sampleName||'สมาชิกตัวอย่าง',avatarUrl:'',color:p.color||colorFor(id)};
    else if(p&&p.name) out[id]={name:p.name,avatarUrl:'',color:colorFor(id)};
    else if(id===state.me.id) out[id]={name:state.me.name||'คุณ',avatarUrl:'',color:state.me.color};
    else out[id]={name:'สมาชิก HR',avatarUrl:'',color:colorFor(id)};
  }
  return out;
}

/* ---------- render core ---------- */
let rendering=false, queued=false;
async function render(){
  if(rendering){ queued=true; return; }
  rendering=true;
  try{ await draw(); }catch(e){ console.error(e); }
  finally{ rendering=false; if(queued){ queued=false; render(); } }
}
function captureFocus(){
  const a=document.activeElement; if(!a||!a.id) return null;
  return {id:a.id,s:a.selectionStart,e:a.selectionEnd};
}
function restoreFocus(f){
  if(!f) return; const el=document.getElementById(f.id); if(!el) return;
  el.focus({preventScroll:true});
  try{ if(f.s!=null&&el.setSelectionRange) el.setSelectionRange(f.s,f.e); }catch(_){}
}
async function draw(){
  const root=document.getElementById('app');
  const frag=document.createDocumentFragment();
  const gate=gateState();
  if(gate){
    frag.append(renderGateTopbar());
    frag.append(await renderGate(gate));
    const f0=captureFocus(); root.replaceChildren(frag); restoreFocus(f0);
    return;
  }
  frag.append(await renderTopbar());
  const main=h('main',{class:'main'});
  if(state.status==='connecting'){
    main.append(h('div',{class:'stack'},h('div',{class:'skeleton'}),h('div',{class:'skeleton'}),h('div',{class:'skeleton'})));
  } else {
    if(!state.live){ /* ยังไม่ได้ตั้งค่า Supabase ใน js/config.js: ใช้ข้อมูลตัวอย่างในหน่วยความจำ */ }
    else if(!state.me.id) main.append(h('div',{class:'banner amber'},h('span',{class:'dot'}),h('div',null,'ไม่พบตัวตนของคุณในองค์กร คุณดูเนื้อหาได้แต่โพสต์หรือแก้โปรไฟล์ไม่ได้')));
    else if(state.canWrite===false) main.append(h('div',{class:'banner'},h('div',null,'บัญชีของคุณมีสิทธิ์ดูอย่างเดียว ขอสิทธิ์ "โต้ตอบได้" จากผู้ดูแลเพื่อโพสต์และแก้โปรไฟล์')));
    const v=state.view;
    if(v==='feed') main.append(await renderFeed());
    else if(v==='directory') main.append(await renderDirectory());
    else if(v==='opps') main.append(await renderOpps());
    else if(v==='profile') main.append(await renderProfile(state.profileId||state.me.id));
    else if(v==='meetings') main.append(await renderMeetings());
    else if(v==='room') main.append(await renderRoom());
    else if(v==='members') main.append(await renderMembers());
    else if(v==='calendar') main.append(await renderCalendar());
  }
  frag.append(main);
  if(ui.chatWith&&state.status==='ready') frag.append(await renderChatWin());
  if(call.status!=='idle') frag.append(await renderCallOverlay());
  const f=captureFocus();
  root.replaceChildren(frag);
  restoreFocus(f);
  if(ui.scrollToPost){ const el=document.getElementById('post-'+ui.scrollToPost); ui.scrollToPost=null; if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('flash'); } }
}
function go(view,profileId){
  if(state.view==='room'&&view!=='room') roomLeave();
  ui.panel=null;
  state.view=view; if(view==='profile'){ state.profileId=profileId||state.me.id; ui.edit=null; }
  window.scrollTo({top:0}); render();
}
async function renderTopbar(){
  const tabs=[['feed','ฟีด'],['directory','ไดเรกทอรี'],['opps','บอร์ดโอกาส'],['meetings','ประชุม'],['calendar','ปฏิทิน']];
  if(state.canEdit) tabs.push(['members','สมาชิก']);
  const ready=state.status==='ready';
  const pend=ready?pendingInvites():0;
  const reqN=ready&&state.canEdit?Object.keys(state.data.requests).length:0;
  const nav=h('nav',{class:'nav','aria-label':'เมนูหลัก'},tabs.map(([k,l])=>h('button',{'aria-current':(state.view===k||(k==='meetings'&&state.view==='room'))?'page':null,onclick:()=>go(k)},l,
    k==='meetings'&&pend?h('span',{class:'badge',title:pend+' คำเชิญที่ยังไม่ได้ตอบ'},pend):null,
    k==='members'&&reqN?h('span',{class:'badge',title:reqN+' คำขอสมัครรออนุมัติ'},reqN):null)));
  const meBtn=h('button',{class:'me-chip',title:'โปรไฟล์ของฉัน',onclick:()=>go('profile',state.me.id),'aria-current':state.view==='profile'&&state.profileId===state.me.id?'page':null},
    avatar(state.me,30),h('span',{class:'nm'},state.me.name||'ฉัน'));
  const dmUn=ready?dmUnreadTotal():0, nUn=ready?notifUnreadCount():0;
  const msgBtn=h('button',{class:'icon-btn'+(ui.panel==='msgs'?' on':''),title:'ข้อความ','aria-label':'ข้อความ','aria-expanded':ui.panel==='msgs'?'true':'false',onclick:()=>togglePanel('msgs')},svg('msg',20),dmUn?h('span',{class:'badge'},dmUn>9?'9+':dmUn):null);
  const bellBtn=h('button',{class:'icon-btn'+(ui.panel==='notifs'?' on':''),title:'การแจ้งเตือน','aria-label':'การแจ้งเตือน','aria-expanded':ui.panel==='notifs'?'true':'false',onclick:()=>togglePanel('notifs')},svg('bell',20),nUn?h('span',{class:'badge'},nUn>9?'9+':nUn):null);
  const actions=h('div',{class:'top-actions'},msgBtn,bellBtn,meBtn);
  if(ready&&ui.panel==='msgs') actions.append(await renderDMPanel());
  if(ready&&ui.panel==='notifs') actions.append(await renderNotifPanel());
  return h('header',{class:'topbar'},h('div',{class:'topbar-in'},
    h('a',{class:'brand',href:'#',style:'text-decoration:none;color:inherit',onclick:e=>{e.preventDefault();go('feed');}},svg('plane',26),h('span',null,'Crew Room',h('small',null,'ฝ่ายทรัพยากรบุคคล · ภายในเท่านั้น'))),
    nav, actions));
}
function togglePanel(p){
  if(ui.panel===p){ ui.panel=null; render(); return; }
  ui.panel=p;
  if(p==='notifs'){ ui.notifMark=state.dm.prefs.notifSeenAt||0; markNotifsSeen(); }
  render();
}
function canAct(){ return state.status!=='connecting'&&!!state.me.id&&state.canWrite!==false&&myApproved(); }
function nameBtn(id,name,cls){ return h('button',{class:cls||'nm',onclick:()=>go('profile',id)},name); }

/* ---------- feed ---------- */
async function renderFeed(){
  const posts=Object.entries(state.data.posts).map(([id,p])=>({id,...p})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const ids=[state.me.id];
  for(const p of posts){ ids.push(p.authorId); for(const c of (p.comments||[])) ids.push(c.authorId); }
  const profiles=Object.entries(state.data.profiles);
  for(const [id] of profiles) ids.push(id);
  const ppl=await people(ids);

  const col=h('div',{class:'stack'});
  if(canAct()){
    const ta=h('textarea',{id:'composer',placeholder:'แบ่งปันสิ่งที่ทีม HR ควรรู้ ประกาศ ชื่นชมเพื่อนร่วมงาน หรือขอคำแนะนำ',oninput:e=>{ui.composer=e.target.value;}},ui.composer);
    const sel=h('select',{id:'composer-kind','aria-label':'ประเภทโพสต์',onchange:e=>{ui.composerKind=e.target.value;}},Object.entries(POST_KINDS).map(([k,l])=>h('option',{value:k,selected:ui.composerKind===k},l)));
    const btn=h('button',{class:'btn primary',onclick:async()=>{
      const text=ui.composer.trim(); if(!text){ toast('พิมพ์ข้อความก่อนโพสต์'); return; }
      btn.disabled=true;
      const ok=await guarded(()=>setDoc('posts',newId('p'),{authorId:state.me.id,kind:ui.composerKind,text,createdAt:Date.now(),likes:[],comments:[]}));
      if(ok){ ui.composer=''; toast('โพสต์แล้ว'); render(); } else btn.disabled=false;
    }},'โพสต์');
    col.append(h('div',{class:'card lift pad composer'},
      h('div',{class:'post-head'},avatar(ppl[state.me.id]||state.me,40),h('div',{class:'who',style:'padding-top:2px'},h('div',{class:'eyebrow'},'เขียนถึงทีม'),h('div',{class:'small muted'},ppl[state.me.id]?ppl[state.me.id].name:'')),),
      h('div',{style:'margin-top:10px'},ta),
      h('div',{class:'row'},sel,h('span',{style:'flex:1'}),btn)));
  }
  if(!posts.length) col.append(h('div',{class:'card pad empty-note'},'ยังไม่มีโพสต์ เป็นคนแรกที่เขียนถึงทีมได้เลย'));
  for(const p of posts) col.append(renderPost(p,ppl));

  return h('div',{class:'feed-grid'},col,renderAside(ppl));
}
function kindChip(k){ return h('span',{class:'chip kind-'+(POST_KINDS[k]?k:'share')},POST_KINDS[k]||POST_KINDS.share); }
function renderPost(p,ppl){
  const a=ppl[p.authorId]||{name:'สมาชิก HR',color:'#6b7b86'};
  const prof=profileOf(p.authorId);
  const liked=Array.isArray(p.likes)&&p.likes.includes(state.me.id);
  const likes=(p.likes||[]).length, comments=(p.comments||[]);
  const mine=p.authorId===state.me.id;
  const head=h('div',{class:'post-head'},avatar(a,42),
    h('div',{class:'who'},
      h('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},nameBtn(p.authorId,a.name),kindChip(p.kind),p.sample?h('span',{class:'chip sample'},'ตัวอย่าง'):null),
      h('div',{class:'ttl'},prof&&prof.title?prof.title+(prof.team?' · '+prof.team:''):'',prof&&prof.title?' · ':'',h('span',{title:new Date(p.createdAt).toLocaleString('th-TH')},ago(p.createdAt||0)))),
    (mine||state.canEdit)&&canAct()?h('button',{class:'btn ghost sm',title:'ลบโพสต์',onclick:async()=>{ if(confirm('ลบโพสต์นี้?')) await guarded(()=>delDoc('posts',p.id)); }},'ลบ'):null);
  const likeBtn=h('button',{class:'btn ghost sm'+(liked?' on':''),disabled:!canAct(),onclick:async()=>{
    const body=clone(p); delete body.id; body.likes=Array.isArray(body.likes)?body.likes:[]; body.likedAt=Object.assign({},body.likedAt||{});
    if(liked){ body.likes=body.likes.filter(x=>x!==state.me.id); delete body.likedAt[state.me.id]; } else { body.likes.push(state.me.id); body.likedAt[state.me.id]=Date.now(); }
    await guarded(()=>setDoc('posts',p.id,body));
  }},svg('like'),liked?'ถูกใจแล้ว':'ถูกใจ',likes?h('b',{style:'font-family:var(--mono);font-variant-numeric:tabular-nums'},likes):null);
  const cmBtn=h('button',{class:'btn ghost sm',onclick:()=>{ const i=document.getElementById('cm-'+p.id); if(i) i.focus(); }},svg('comment'),'ความคิดเห็น',comments.length?h('b',{style:'font-family:var(--mono);font-variant-numeric:tabular-nums'},comments.length):null);
  const cl=h('div',{class:'comments'},comments.map(c=>{
    const ca=ppl[c.authorId]||{name:'สมาชิก HR',color:'#6b7b86'};
    return h('div',{class:'comment'},avatar(ca,28),h('div',{class:'bubble'},h('b',null,ca.name),' ',h('span',{class:'muted small'},ago(c.createdAt||0)),h('div',null,c.text)));
  }));
  let form=null;
  if(canAct()){
    const inp=h('input',{id:'cm-'+p.id,placeholder:'เขียนความคิดเห็น แล้วกด Enter',value:ui.commentDraft[p.id]||'',oninput:e=>{ui.commentDraft[p.id]=e.target.value;},onkeydown:async e=>{
      if(e.key!=='Enter') return; e.preventDefault();
      const text=(ui.commentDraft[p.id]||'').trim(); if(!text) return;
      const body=clone(p); delete body.id; body.comments=Array.isArray(body.comments)?body.comments:[];
      body.comments.push({authorId:state.me.id,text,createdAt:Date.now()});
      const ok=await guarded(()=>setDoc('posts',p.id,body)); if(ok){ delete ui.commentDraft[p.id]; render(); }
    }});
    form=h('div',{class:'comment-form'},avatar(ppl[state.me.id]||state.me,28),inp);
  }
  return h('article',{class:'card pad',id:'post-'+p.id},head,h('div',{class:'post-body'},p.text),h('div',{class:'post-actions'},likeBtn,cmBtn),comments.length?cl:null,form);
}
function renderAside(ppl){
  const me=ppl[state.me.id]||state.me; const mp=myProfile(); const pct=completeness(mp);
  const myCard=h('div',{class:'card pad'},
    h('div',{class:'person-row'},avatar(me,44),h('div',{class:'txt'},h('b',{onclick:()=>go('profile',state.me.id)},me.name||'ฉัน'),h('span',null,mp&&mp.title?mp.title:'ยังไม่ได้กรอกตำแหน่ง'))),
    h('div',{class:'stat-row'},h('span',null,h('b',null,pct),'% โปรไฟล์'),h('span',null,'ติดตาม ',h('b',null,(mp&&mp.following||[]).length)),h('span',null,'ทักษะ ',h('b',null,(mp&&mp.skills||[]).length))),
    h('div',{class:'meter'},h('i',{style:'width:'+pct+'%'})),
    state.me.id?h('div',{style:'margin-top:12px'},h('button',{class:'btn sm',onclick:()=>{go('profile',state.me.id); ui.edit=editModel(); render();}},pct<100?'กรอกโปรไฟล์ให้ครบ':'แก้ไขโปรไฟล์')):null);
  const sugg=Object.entries(state.data.profiles).filter(([id])=>id!==state.me.id&&visibleMember(id)&&!isFollowing(id)).sort((a,b)=>((b[1].skills||[]).length)-((a[1].skills||[]).length)).slice(0,3);
  const suggCard=h('div',{class:'card pad'},h('h3',null,'คนที่น่าติดตาม'),
    sugg.length?h('div',{class:'people-list'},sugg.map(([id,p])=>{ const a=ppl[id]||{name:'สมาชิก HR'}; return h('div',{class:'person-row'},avatar(a,36),h('div',{class:'txt'},h('b',{onclick:()=>go('profile',id)},a.name),h('span',null,p.title||p.team||'')),followBtn(id,true)); })):h('div',{class:'empty-note'},'คุณติดตามทุกคนในแผนกแล้ว'));
  const opps=Object.entries(state.data.opportunities).map(([id,o])=>({id,...o})).filter(o=>o.status!=='closed'&&o.deadline>=Date.now()).sort((a,b)=>a.deadline-b.deadline).slice(0,3);
  const oppCard=h('div',{class:'card pad'},h('h3',null,'ปิดรับเร็วๆ นี้'),
    opps.length?h('div',null,opps.map(o=>h('div',{class:'deadline-row'},h('button',{class:'btn ghost sm',style:'padding:0;white-space:normal;text-align:left;font-weight:500;color:var(--ink)',onclick:()=>{ui.expandedOpp=o.id;go('opps');}},o.title),h('span',{class:'d'},daysLeft(o.deadline)<=0?'วันนี้':'อีก '+daysLeft(o.deadline)+' วัน')))):h('div',{class:'empty-note'},'ยังไม่มีประกาศที่เปิดรับ'),
    h('div',{style:'margin-top:10px'},h('button',{class:'btn ghost sm',onclick:()=>go('opps')},'ดูบอร์ดโอกาสทั้งหมด')));
  const nextMeets=meetingsList().filter(m=>{ const ph=meetPhase(m); return (ph==='live'||ph==='upcoming')&&(m.open||isInvited(m)); }).sort((a,b)=>a.startAt-b.startAt).slice(0,3);
  const meetCard=h('div',{class:'card pad'},h('h3',null,'ประชุมถัดไป'),
    nextMeets.length?h('div',null,nextMeets.map(m=>{ const ph=meetPhase(m); return h('div',{class:'deadline-row'},h('button',{class:'btn ghost sm',style:'padding:0;white-space:normal;text-align:left;font-weight:500;color:var(--ink)',onclick:()=>enterRoom(m.id)},ph==='live'?h('span',{class:'live-dot'}):null,m.title),h('span',{class:'d',style:ph==='live'?'color:var(--ok)':''},ph==='live'?'กำลังประชุม':dayLabel(m.startAt)+' '+fmtTime(m.startAt))); })):h('div',{class:'empty-note'},'ยังไม่มีนัดประชุม'),
    h('div',{style:'margin-top:10px;display:flex;gap:6px;flex-wrap:wrap'},h('button',{class:'btn ghost sm',onclick:()=>go('meetings')},'ดูห้องประชุมทั้งหมด'),h('button',{class:'btn ghost sm',onclick:()=>go('calendar')},'ปฏิทิน'),canAct()?h('button',{class:'btn sm',onclick:startInstant},'เริ่มประชุมทันที'):null));
  return h('aside',{class:'aside'},myCard,meetCard,suggCard,oppCard);
}
function followBtn(id,small){
  const on=isFollowing(id);
  return h('button',{class:'btn'+(small?' sm':'')+(on?' on':''),disabled:!canAct(),onclick:async()=>{
    const cur=myProfile(); const body=cur?clone(cur):{title:'',team:'',location:'',bio:'',skills:[],experience:[],certs:[],following:[]};
    body.following=Array.isArray(body.following)?body.following:[];
    body.following=on?body.following.filter(x=>x!==id):[...body.following,id];
    body.updatedAt=Date.now();
    await guarded(()=>setDoc('profiles',state.me.id,body));
  }},on?'กำลังติดตาม':'ติดตาม');
}

/* ---------- directory ---------- */
async function renderDirectory(){
  const entries=Object.entries(state.data.profiles).filter(([id])=>visibleMember(id));
  const ppl=await people(entries.map(([id])=>id).concat([state.me.id]));
  const q=ui.dirQ.trim().toLowerCase();
  const list=entries.map(([id,p])=>({id,...p,name:(ppl[id]||{}).name||''})).filter(p=>{
    if(ui.dirTeam&&p.team!==ui.dirTeam) return false;
    if(!q) return true;
    const hay=[p.name,p.title,p.team,p.location,...(p.skills||[])].join(' ').toLowerCase();
    return hay.includes(q);
  }).sort((a,b)=>a.name.localeCompare(b.name,'th'));
  const search=h('input',{type:'search',id:'dir-q',placeholder:'ค้นหาชื่อ ตำแหน่ง หรือทักษะ เช่น PDPA',value:ui.dirQ,oninput:e=>{ui.dirQ=e.target.value;render();}});
  const chips=h('div',{class:'team-chips'},h('button',{class:ui.dirTeam===''?'on':'',onclick:()=>{ui.dirTeam='';render();}},'ทุกทีม'),TEAMS.map(t=>h('button',{class:ui.dirTeam===t?'on':'',onclick:()=>{ui.dirTeam=ui.dirTeam===t?'':t;render();}},t)));
  const grid=h('div',{class:'dir-grid'},list.map(p=>{
    const a=ppl[p.id]||{name:'สมาชิก HR'}; const top=(p.skills||[]).slice(0,4);
    return h('div',{class:'card pad member'},
      h('div',{class:'top'},avatar(a,46),h('div',{style:'min-width:0'},h('div',{style:'display:flex;gap:6px;align-items:center;flex-wrap:wrap'},nameBtn(p.id,a.name),p.sample?h('span',{class:'chip sample'},'ตัวอย่าง'):null,p.id===state.me.id?h('span',{class:'chip'},'คุณ'):null),h('div',{class:'small muted'},p.title||'ยังไม่ระบุตำแหน่ง'))),
      h('div',{class:'small'},h('span',{class:'eyebrow'},p.team||'ยังไม่ระบุทีม')),
      h('div',{class:'skills'},top.map(s=>h('span',{class:'skill'},s,endorseCount(p.id,s)?h('span',{class:'n'},endorseCount(p.id,s)):null)),(p.skills||[]).length>4?h('span',{class:'skill muted'},'+'+((p.skills||[]).length-4)):null),
      h('div',{class:'foot'},h('span',{class:'small muted'},'ติดตาม '+((p.following||[]).length)+' คน'),p.id!==state.me.id?h('div',{style:'display:flex;gap:6px'},h('button',{class:'btn sm',title:'ส่งข้อความส่วนตัว',onclick:()=>openChat(p.id)},svg('msg',15),'ข้อความ'),followBtn(p.id,true)):h('button',{class:'btn sm',onclick:()=>go('profile',state.me.id)},'ดูโปรไฟล์')));
  }));
  const sampleCount=entries.filter(([,p])=>p.sample).length;
  const wrap=h('div',null,
    h('div',{style:'display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:12px'},h('h2',null,'ไดเรกทอรีทีม HR'),h('span',{class:'small muted'},list.length+' คน')),
    h('div',{class:'toolbar'},search,chips),
    list.length?grid:h('div',{class:'card pad empty-note'},'ไม่พบสมาชิกที่ตรงกับเงื่อนไข'));
  if(state.live&&state.canEdit&&sampleCount){
    wrap.append(h('div',{class:'banner',style:'margin-top:20px;justify-content:space-between;align-items:center'},h('span',null,'มีข้อมูลตัวอย่าง '+sampleCount+' โปรไฟล์ เมื่อทีมเริ่มใช้งานจริงแล้วลบออกได้'),h('button',{class:'btn sm danger',onclick:clearSamples},'ล้างข้อมูลตัวอย่างทั้งหมด')));
  }
  return wrap;
}
async function clearSamples(){
  if(!confirm('ลบโปรไฟล์ โพสต์ ประกาศ และการรับรองที่เป็นตัวอย่างทั้งหมด?')) return;
  const jobs=[];
  for(const c of ['profiles','posts','opportunities','meetings','members','requests','events']) for(const [id,d] of Object.entries(state.data[c])) if(d.sample||id.startsWith('sample-')) jobs.push(()=>delDoc(c,id));
  for(const id of Object.keys(state.data.endorsements)) if(id.startsWith('sample-')) jobs.push(()=>delDoc('endorsements',id));
  let ok=true; for(const j of jobs){ if(!(await guarded(j))){ ok=false; break; } }
  if(ok) toast('ลบข้อมูลตัวอย่างแล้ว');
}

/* ---------- opportunities ---------- */
async function renderOpps(){
  const list=Object.entries(state.data.opportunities).map(([id,o])=>({id,...o})).sort((a,b)=>{
    const ac=a.status==='closed'||a.deadline<Date.now(), bc=b.status==='closed'||b.deadline<Date.now();
    if(ac!==bc) return ac?1:-1; return a.deadline-b.deadline;
  });
  const ppl=await people(list.map(o=>o.postedBy).concat(list.flatMap(o=>o.interested||[])).concat([state.me.id]));
  const clock=new Date().toLocaleString('th-TH',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  const board=h('section',{class:'board','aria-label':'บอร์ดโอกาสภายในแผนก'},
    h('div',{class:'bhead'},h('h2',null,'Opportunities · โอกาสภายในแผนก'),h('span',{class:'clock'},clock)),
    h('div',{class:'brow hd'},h('span',null,'ปิดรับ'),h('span',null,'ประเภท'),h('span',null,'หัวข้อ'),h('span',null,'ทีม'),h('span',null,'สถานะ')));
  if(!list.length) board.append(h('div',{class:'empty'},'ยังไม่มีประกาศ ตำแหน่งงานภายใน โครงการ หรือหลักสูตรที่เปิดรับ'));
  for(const o of list){
    const closed=o.status==='closed'||o.deadline<Date.now();
    const open=ui.expandedOpp===o.id;
    board.append(h('button',{class:'brow item'+(closed?' closed':''),'aria-expanded':open?'true':'false',onclick:()=>{ui.expandedOpp=open?null:o.id;render();}},
      h('span',{class:'dl'},h('span',{class:'mob'},'ปิดรับ'),fmtBoard(o.deadline)),
      h('span',null,h('span',{class:'mob'},'ประเภท'),o.type),
      h('span',{class:'ttl'},o.title),
      h('span',{class:'tm'},o.team),
      h('span',{class:'st '+(closed?'closed':'open')},closed?'CLOSED':'OPEN')));
    if(open){
      const poster=ppl[o.postedBy]||{name:'สมาชิก HR'};
      const interested=Array.isArray(o.interested)?o.interested:[];
      const mine=interested.includes(state.me.id);
      const canManage=(o.postedBy===state.me.id||state.canEdit)&&canAct();
      const acts=h('div',{class:'acts'});
      if(!closed&&canAct()) acts.append(h('button',{class:'btn'+(mine?' on':''),onclick:async()=>{
        const body=clone(o); delete body.id; body.interested=interested.filter(x=>x!==state.me.id); body.interestedAt=Object.assign({},body.interestedAt||{});
        if(mine) delete body.interestedAt[state.me.id]; else { body.interested.push(state.me.id); body.interestedAt[state.me.id]=Date.now(); }
        await guarded(()=>setDoc('opportunities',o.id,body));
      }},mine?'สนใจแล้ว · ยกเลิก':'สนใจ'));
      if(canManage&&!closed) acts.append(h('button',{class:'btn',onclick:async()=>{ const body=clone(o); delete body.id; body.status='closed'; await guarded(()=>setDoc('opportunities',o.id,body)); }},'ปิดรับ'));
      if(canManage) acts.append(h('button',{class:'btn danger',onclick:async()=>{ if(confirm('ลบประกาศนี้?')) await guarded(()=>delDoc('opportunities',o.id)); }},'ลบ'));
      const names=interested.map(id=>(ppl[id]||{name:'สมาชิก HR'}).name);
      board.append(h('div',{class:'bdetail'},
        h('div',{class:'meta'},h('span',null,'ประกาศโดย '+poster.name),h('span',null,'เมื่อ '+fmtDate(o.createdAt||0)),h('span',null,'ปิดรับ '+fmtDate(o.deadline)+(closed?'':' (อีก '+Math.max(0,daysLeft(o.deadline))+' วัน)')),o.sample?h('span',null,'ตัวอย่าง'):null),
        h('p',null,o.description||''),
        h('div',{class:'meta'},h('span',null,'ผู้สนใจ '+interested.length+' คน'+(names.length?': '+names.join(', '):''))),
        acts));
    }
  }
  const wrap=h('div',null,
    h('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px'},
      h('div',null,h('h2',null,'บอร์ดโอกาส'),h('div',{class:'small muted'},'ตำแหน่งงานภายใน โครงการพิเศษ พี่เลี้ยง และหลักสูตรที่เปิดให้คนในแผนก')),
      canAct()?h('button',{class:'btn primary',onclick:()=>{ui.showOppForm=!ui.showOppForm; if(!ui.oppForm) ui.oppForm={title:'',type:OPP_TYPES[0],team:(myProfile()||{}).team||TEAMS[0],deadline:'',description:''}; render();}},ui.showOppForm?'ปิดฟอร์ม':'ลงประกาศใหม่'):null));
  if(ui.showOppForm&&canAct()) wrap.append(renderOppForm());
  wrap.append(board);
  return wrap;
}
function field(label,input){ return h('div',{class:'field'},h('label',{for:input.id},label),input); }
function renderOppForm(){
  const f=ui.oppForm;
  const title=h('input',{id:'opp-title',value:f.title,placeholder:'เช่น Senior Recruiter (ฝ่ายภาคพื้น)',oninput:e=>{f.title=e.target.value;}});
  const type=h('select',{id:'opp-type',onchange:e=>{f.type=e.target.value;}},OPP_TYPES.map(t=>h('option',{value:t,selected:f.type===t},t)));
  const team=h('select',{id:'opp-team',onchange:e=>{f.team=e.target.value;}},TEAMS.map(t=>h('option',{value:t,selected:f.team===t},t)));
  const dl=h('input',{id:'opp-deadline',type:'date',value:f.deadline,oninput:e=>{f.deadline=e.target.value;}});
  const desc=h('textarea',{id:'opp-desc',placeholder:'รายละเอียด คุณสมบัติ ช่วงเวลา และวิธีติดต่อ',oninput:e=>{f.description=e.target.value;}},f.description);
  const save=h('button',{class:'btn primary',onclick:async()=>{
    if(!f.title.trim()){ toast('ใส่หัวข้อประกาศ'); return; }
    const ts=f.deadline?new Date(f.deadline+'T23:59:59').getTime():NaN;
    if(!ts||isNaN(ts)){ toast('เลือกวันปิดรับ'); return; }
    save.disabled=true;
    const ok=await guarded(()=>setDoc('opportunities',newId('o'),{title:f.title.trim(),type:f.type,team:f.team,deadline:ts,description:f.description.trim(),postedBy:state.me.id,createdAt:Date.now(),status:'open',interested:[]}));
    if(ok){ ui.showOppForm=false; ui.oppForm=null; toast('ลงประกาศแล้ว'); render(); } else save.disabled=false;
  }},'ลงประกาศ');
  return h('div',{class:'card lift pad',style:'margin-bottom:16px'},h('div',{class:'form'},
    field('หัวข้อ',title),
    h('div',{class:'form-row'},field('ประเภท',type),field('ทีมที่เกี่ยวข้อง',team)),
    h('div',{class:'form-row'},field('วันปิดรับ',dl)),
    field('รายละเอียด',desc),
    h('div',{class:'form-actions'},h('button',{class:'btn',onclick:()=>{ui.showOppForm=false;render();}},'ยกเลิก'),save)));
}

/* ---------- profile ---------- */
function editModel(){
  const p=myProfile();
  return p?clone({name:p.name||state.me.name||'',title:p.title||'',team:p.team||'',location:p.location||'',bio:p.bio||'',skills:p.skills||[],experience:p.experience||[],certs:p.certs||[]}):{name:state.me.name||'',title:'',team:'',location:'',bio:'',skills:[],experience:[],certs:[]};
}
async function renderProfile(id){
  if(!id) return h('div',{class:'card pad empty-note'},'ไม่พบโปรไฟล์');
  const p=profileOf(id); const mine=id===state.me.id;
  const posts=Object.entries(state.data.posts).map(([pid,x])=>({id:pid,...x})).filter(x=>x.authorId===id).sort((a,b)=>b.createdAt-a.createdAt);
  const ids=[id,state.me.id]; for(const x of posts){ for(const c of (x.comments||[])) ids.push(c.authorId); }
  const e=state.data.endorsements[id]; if(e&&e.bySkill) for(const arr of Object.values(e.bySkill)) if(Array.isArray(arr)) ids.push(...arr);
  const ppl=await people(ids);
  const a=ppl[id]||{name:'สมาชิก HR',color:'#6b7b86'};
  if(mine&&ui.edit) return renderEdit(a);

  const followers=Object.values(state.data.profiles).filter(x=>Array.isArray(x.following)&&x.following.includes(id)).length;
  const head=h('div',{class:'card lift pad'},h('div',{class:'profile-head'},avatar(a,84),
    h('div',{class:'who'},
      h('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},h('h2',null,a.name),p&&p.sample?h('span',{class:'chip sample'},'ตัวอย่าง'):null),
      h('div',{class:'ttl'},p&&p.title?p.title:h('span',{class:'muted'},mine?'ยังไม่ได้กรอกตำแหน่ง':'ยังไม่ระบุตำแหน่ง')),
      h('div',{class:'loc'},p&&p.team?h('span',null,p.team):null,p&&p.location?h('span',null,p.location):null),
      h('div',{class:'stat-row'},h('span',null,h('b',null,followers),' ผู้ติดตาม'),h('span',null,h('b',null,(p&&p.following||[]).length),' กำลังติดตาม'),h('span',null,h('b',null,posts.length),' โพสต์'))),
    h('div',{class:'acts'},mine?[canAct()?h('button',{class:'btn primary',onclick:()=>{ui.edit=editModel();render();}},'แก้ไขโปรไฟล์'):null,state.live?h('button',{class:'btn',title:'ล็อกหน้าจอ ต้องใส่ PIN เพื่อเข้าใหม่',onclick:lockScreen},'ออกจากระบบ'):null]:[h('button',{class:'btn primary',onclick:()=>openChat(id)},svg('msg',16),'ส่งข้อความ'),followBtn(id,false)])));

  const skills=(p&&p.skills)||[];
  const skillEls=skills.map(s=>{
    const n=endorseCount(id,s), by=endorsedByMe(id,s);
    if(mine||!canAct()) return h('span',{class:'skill',title:n?'รับรองโดย '+n+' คน':''},s,n?h('span',{class:'n'},n):null);
    return h('button',{class:'skill btn-like'+(by?' mine':''),title:by?'ยกเลิกการรับรอง':'รับรองทักษะนี้',onclick:async()=>{
      const cur=state.data.endorsements[id]; const body=cur?clone(cur):{bySkill:{}}; body.bySkill=body.bySkill||{}; body.at=body.at||{}; body.at[s]=body.at[s]||{};
      const arr=Array.isArray(body.bySkill[s])?body.bySkill[s]:[];
      body.bySkill[s]=by?arr.filter(x=>x!==state.me.id):[...arr,state.me.id];
      if(by) delete body.at[s][state.me.id]; else body.at[s][state.me.id]=Date.now();
      await guarded(()=>setDoc('endorsements',id,body));
    }},s,n?h('span',{class:'n'},n):null,h('span',{class:'muted',style:'font-size:12px'},by?'✓':'+'));
  });
  const left=h('div',null,
    h('div',{class:'card pad section'},h('h3',null,'เกี่ยวกับ'),p&&p.bio?h('div',{class:'bio'},p.bio):h('div',{class:'empty-note'},mine?'เล่าสั้นๆ ว่าคุณดูแลงานอะไร และถนัดเรื่องไหน':'ยังไม่มีข้อมูล')),
    h('div',{class:'card pad section'},h('h3',null,'ประสบการณ์'),(p&&p.experience||[]).length?h('div',null,(p.experience).map(x=>h('div',{class:'exp'},h('div',{class:'yrs'},(x.from||'')+(x.to?' – '+x.to:'')),h('div',null,h('b',null,x.role||''),h('div',{class:'org'},x.org||''),x.desc?h('p',null,x.desc):null)))):h('div',{class:'empty-note'},'ยังไม่มีข้อมูล')),
    h('div',{class:'card pad section'},h('h3',null,'โพสต์ล่าสุด'),posts.length?h('div',{class:'stack'},posts.slice(0,5).map(x=>renderPost(x,ppl))):h('div',{class:'empty-note'},'ยังไม่มีโพสต์')));
  const right=h('div',null,
    h('div',{class:'card pad section'},h('h3',null,'ทักษะ',h('span',{class:'eyebrow'},mine?'':'กดเพื่อรับรอง')),skills.length?h('div',{class:'skills'},skillEls):h('div',{class:'empty-note'},'ยังไม่มีทักษะ')),
    h('div',{class:'card pad section'},h('h3',null,'ใบรับรองและการอบรม'),(p&&p.certs||[]).length?h('div',null,p.certs.map(c=>h('div',{class:'cert'},h('div',null,h('b',null,c.name||''),h('div',{class:'small muted'},c.issuer||'')),h('span',{class:'yr'},c.year||'')))):h('div',{class:'empty-note'},'ยังไม่มีข้อมูล')));
  return h('div',null,head,h('div',{class:'profile-grid'},left,right));
}
function renderEdit(a){
  const f=ui.edit;
  const nameInp=h('input',{id:'ed-name',value:f.name||'',placeholder:'ชื่อ-นามสกุลที่ให้เพื่อนร่วมทีมเห็น',maxlength:'80',oninput:e=>{f.name=e.target.value;}});
  const title=h('input',{id:'ed-title',value:f.title,placeholder:'เช่น เจ้าหน้าที่สรรหาอาวุโส',oninput:e=>{f.title=e.target.value;}});
  const team=h('select',{id:'ed-team',onchange:e=>{f.team=e.target.value;}},h('option',{value:'',selected:!f.team},'เลือกทีม'),TEAMS.map(t=>h('option',{value:t,selected:f.team===t},t)));
  const loc=h('input',{id:'ed-loc',value:f.location,placeholder:'เช่น สำนักงานใหญ่',oninput:e=>{f.location=e.target.value;}});
  const bio=h('textarea',{id:'ed-bio',placeholder:'งานที่ดูแล ความถนัด และเรื่องที่อยากให้เพื่อนร่วมทีมมาปรึกษา',oninput:e=>{f.bio=e.target.value;}},f.bio);
  const skillInput=h('input',{id:'ed-skill',placeholder:'พิมพ์ทักษะแล้วกด Enter',onkeydown:e=>{
    if(e.key==='Enter'||e.key===','){ e.preventDefault(); const v=e.target.value.trim(); if(v&&!f.skills.includes(v)&&f.skills.length<20){ f.skills.push(v); render(); } e.target.value=''; }
    else if(e.key==='Backspace'&&!e.target.value&&f.skills.length){ f.skills.pop(); render(); }
  }});
  const chipBox=h('div',{class:'chip-input',onclick:()=>skillInput.focus()},f.skills.map((s,i)=>h('span',{class:'skill'},s,h('button',{type:'button','aria-label':'ลบ '+s,onclick:ev=>{ev.stopPropagation();f.skills.splice(i,1);render();}},'×'))),skillInput);
  const expRows=f.experience.map((x,i)=>h('div',{class:'rep-row'},
    field('ตำแหน่ง',h('input',{id:'ex-role-'+i,value:x.role||'',oninput:e=>{x.role=e.target.value;}})),
    field('หน่วยงาน',h('input',{id:'ex-org-'+i,value:x.org||'',oninput:e=>{x.org=e.target.value;}})),
    field('เริ่ม (พ.ศ.)',h('input',{id:'ex-from-'+i,value:x.from||'',placeholder:'2565',oninput:e=>{x.from=e.target.value;}})),
    field('ถึง',h('input',{id:'ex-to-'+i,value:x.to||'',placeholder:'ปัจจุบัน',oninput:e=>{x.to=e.target.value;}})),
    h('button',{class:'btn ghost sm danger',type:'button',onclick:()=>{f.experience.splice(i,1);render();}},'ลบ'),
    h('div',{style:'grid-column:1/-1'},field('รายละเอียด (ไม่บังคับ)',h('input',{id:'ex-desc-'+i,value:x.desc||'',oninput:e=>{x.desc=e.target.value;}})))));
  const certRows=f.certs.map((c,i)=>h('div',{class:'rep-row certs'},
    field('ชื่อใบรับรอง/หลักสูตร',h('input',{id:'ct-name-'+i,value:c.name||'',oninput:e=>{c.name=e.target.value;}})),
    field('ผู้ออก',h('input',{id:'ct-iss-'+i,value:c.issuer||'',placeholder:'เช่น CAAT, SHRM',oninput:e=>{c.issuer=e.target.value;}})),
    field('ปี (พ.ศ.)',h('input',{id:'ct-year-'+i,value:c.year||'',oninput:e=>{c.year=e.target.value;}})),
    h('button',{class:'btn ghost sm danger',type:'button',onclick:()=>{f.certs.splice(i,1);render();}},'ลบ')));
  const save=h('button',{class:'btn primary',onclick:async()=>{
    save.disabled=true;
    const cur=myProfile();
    const body={name:(f.name||'').trim()||(cur&&cur.name)||state.me.name||'',title:f.title.trim(),team:f.team,location:f.location.trim(),bio:f.bio.trim(),skills:f.skills,experience:f.experience.filter(x=>(x.role||x.org)),certs:f.certs.filter(c=>c.name),following:(cur&&cur.following)||[],updatedAt:Date.now()};
    if(cur&&cur.pubKey) body.pubKey=cur.pubKey;
    const ok=await guarded(()=>setDoc('profiles',state.me.id,body));
    if(ok){ if(body.name) state.me.name=body.name; ui.edit=null; toast('บันทึกโปรไฟล์แล้ว'); render(); } else save.disabled=false;
  }},'บันทึก');
  return h('div',{class:'card lift pad'},
    h('div',{class:'profile-head',style:'margin-bottom:16px'},avatar(a,64),h('div',{class:'who'},h('div',{class:'eyebrow'},'แก้ไขโปรไฟล์'),h('h2',null,a.name),h('div',{class:'small muted'},'รูปโปรไฟล์ใช้อักษรย่อจากชื่อที่แสดง'))),
    h('div',{class:'form'},
      field('ชื่อที่แสดง',nameInp),
      h('div',{class:'form-row'},field('ตำแหน่ง',title),field('ทีม',team)),
      h('div',{class:'form-row'},field('สถานที่ทำงาน',loc)),
      field('เกี่ยวกับ',bio),
      h('div',{class:'field'},h('label',{for:'ed-skill'},'ทักษะ (สูงสุด 20)'),chipBox),
      h('div',null,h('div',{class:'eyebrow',style:'margin-bottom:8px'},'ประสบการณ์'),h('div',{class:'form'},expRows),h('div',{style:'margin-top:8px'},h('button',{class:'btn sm',type:'button',onclick:()=>{f.experience.push({role:'',org:'',from:'',to:'',desc:''});render();}},'+ เพิ่มประสบการณ์'))),
      h('div',null,h('div',{class:'eyebrow',style:'margin-bottom:8px'},'ใบรับรองและการอบรม'),h('div',{class:'form'},certRows),h('div',{style:'margin-top:8px'},h('button',{class:'btn sm',type:'button',onclick:()=>{f.certs.push({name:'',issuer:'',year:''});render();}},'+ เพิ่มใบรับรอง'))),
      h('div',{class:'form-actions'},h('button',{class:'btn',onclick:()=>{ui.edit=null;render();}},'ยกเลิก'),save)));
}

/* ---------- meetings ---------- */
async function updateDoc(coll,id,patch){
  const cur=state.data[coll]&&state.data[coll][id];
  if(!cur) throw {code:'invalid_argument',message:'document missing'};
  const body=deepMerge(clone(cur),clone(patch));
  if(!state.live){ state.data[coll][id]=body; render(); return; }
  const {error}=await sb.from('docs').update({data:body}).match({collection:coll,id});
  if(error) throw dbErr(error);
  state.data[coll][id]=body; render();
}
function meetingsList(){ return Object.entries(state.data.meetings).map(([id,m])=>({id,...m})); }
function meetEnd(m){ return (m.startAt||0)+(m.durationMin||60)*MIN; }
function meetPhase(m){
  const n=Date.now();
  if(m.status==='ended') return 'ended';
  if(n>=m.startAt-10*MIN&&n<=meetEnd(m)+15*MIN) return 'live';
  if(n<m.startAt) return 'upcoming';
  return 'past';
}
function isInvited(m){ return m.hostId===state.me.id||(m.invitees||[]).includes(state.me.id); }
function pendingInvites(){
  if(!state.me.id) return 0;
  return meetingsList().filter(m=>m.hostId!==state.me.id&&(m.invitees||[]).includes(state.me.id)&&!((m.responses||{})[state.me.id])&&['live','upcoming'].includes(meetPhase(m))).length;
}
function fmtTime(ts){ return new Date(ts).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}); }
function fmtDay(ts){ return new Date(ts).toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'}); }
function dayLabel(ts){
  const d=new Date(ts), t=new Date(); const same=(a,b)=>a.toDateString()===b.toDateString();
  if(same(d,t)) return 'วันนี้'; if(same(d,new Date(t.getTime()+DAY))) return 'พรุ่งนี้'; if(same(d,new Date(t.getTime()-DAY))) return 'เมื่อวาน';
  return fmtDay(ts);
}
function pad2(n){ return String(n).padStart(2,'0'); }
function safeUrl(u){ u=String(u||'').trim(); return /^https?:\/\/[^\s]+$/i.test(u)?u:''; }
function defaultMeetForm(){
  const d=new Date(Date.now()+HOUR); d.setMinutes(d.getMinutes()>=30?30:0,0,0);
  return {title:'',agenda:'',date:d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()),time:pad2(d.getHours())+':'+pad2(d.getMinutes()),durationMin:60,invitees:[],open:true,link:'',extra:{},q:'',hits:[]};
}
async function startInstant(){
  if(!canAct()) return;
  const id=newId('m');
  const ok=await guarded(()=>setDoc('meetings',id,{title:'ประชุมด่วน · '+(state.me.name||'สมาชิก HR'),agenda:'',startAt:Date.now(),durationMin:60,hostId:state.me.id,invitees:[],responses:{},open:true,link:'',status:'scheduled',notes:'',createdAt:Date.now()}));
  if(ok) enterRoom(id);
}
async function renderMeetings(){
  const list=meetingsList().sort((a,b)=>a.startAt-b.startAt);
  const ids=[state.me.id]; for(const m of list){ ids.push(m.hostId,...(m.invitees||[])); }
  const ppl=await people(ids);
  const groups={live:[],today:[],upcoming:[],past:[]};
  for(const m of list){ const ph=meetPhase(m); if(ph==='live') groups.live.push(m); else if(ph==='upcoming') (dayLabel(m.startAt)==='วันนี้'?groups.today:groups.upcoming).push(m); else groups.past.push(m); }
  groups.past.sort((a,b)=>b.startAt-a.startAt); groups.past=groups.past.slice(0,8);
  const wrap=h('div',null,
    h('div',{style:'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:16px'},
      h('div',null,h('h2',null,'ห้องประชุมออนไลน์'),h('div',{class:'small muted'},'นัดหมายและเชิญคนในแผนกได้ที่นี่โดยไม่ต้องส่งอีเมล ผู้ถูกเชิญจะเห็นคำเชิญในแท็บนี้และตอบรับได้ทันที')),
      canAct()?h('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},h('button',{class:'btn',onclick:startInstant},h('span',{class:'live-dot'}),'เริ่มประชุมทันที'),h('button',{class:'btn primary',onclick:()=>{ui.showMeetForm=!ui.showMeetForm; if(!ui.meetForm) ui.meetForm=defaultMeetForm(); render();}},ui.showMeetForm?'ปิดฟอร์ม':'นัดประชุมใหม่')):null));
  if(ui.showMeetForm&&canAct()) wrap.append(await renderMeetForm(ppl));
  const sections=[['live','กำลังประชุม / เปิดห้องได้แล้ว'],['today','วันนี้'],['upcoming','ที่กำลังจะมาถึง'],['past','ที่ผ่านมา']];
  let any=false;
  for(const [k,label] of sections){
    if(!groups[k].length) continue; any=true;
    wrap.append(h('div',{class:'meet-group'},h('span',{class:'eyebrow'},label),h('div',{class:'stack'},groups[k].map(m=>renderMeet(m,ppl)))));
  }
  if(!any) wrap.append(h('div',{class:'card pad empty-note'},'ยังไม่มีนัดประชุม กด "นัดประชุมใหม่" เพื่อเชิญเพื่อนร่วมทีม หรือ "เริ่มประชุมทันที" เพื่อเปิดห้องเดี๋ยวนี้'));
  return wrap;
}
function renderMeet(m,ppl){
  const ph=meetPhase(m); const host=ppl[m.hostId]||{name:'สมาชิก HR',color:'#6b7b86'};
  const inv=m.invitees||[]; const resp=m.responses||{};
  const accepted=inv.filter(i=>resp[i]==='accept').length;
  const mine=resp[state.me.id]; const invited=inv.includes(state.me.id); const isHost=m.hostId===state.me.id;
  const when=h('div',{class:'when'+(ph==='live'?' live':'')},h('b',null,fmtTime(m.startAt)),h('span',null,dayLabel(m.startAt)),h('span',null,(m.durationMin||60)+' นาที'));
  const all=[m.hostId,...inv];
  const avs=h('div',{class:'avatars'},all.slice(0,6).map(id=>{ const p=ppl[id]||{name:'?',color:'#6b7b86'}; const a=avatar(p,24); a.title=p.name+(resp[id]==='accept'?' · เข้าร่วม':resp[id]==='decline'?' · ไม่สะดวก':id===m.hostId?' · ผู้จัด':''); return a; }),all.length>6?h('span',{class:'more'},'+'+(all.length-6)):null);
  const sub=h('div',{class:'sub'},h('span',null,'ผู้จัด '+host.name),h('span',null,'ตอบรับ '+accepted+'/'+inv.length),h('span',null,m.open?'เปิดให้ทุกคนในแผนก':'เฉพาะผู้ได้รับเชิญ'),ph==='ended'?h('span',null,'จบแล้ว'):null);
  let rsvp=null;
  if(invited&&!isHost&&canAct()&&(ph==='live'||ph==='upcoming')){
    const opts=[['accept','เข้าร่วม','yes'],['maybe','ไม่แน่ใจ',''],['decline','ไม่สะดวก','no']];
    rsvp=h('div',{class:'rsvp'},h('span',{class:'small muted'},mine?'คำตอบของคุณ:':'ตอบรับคำเชิญ:'),opts.map(([v,l,c])=>h('button',{class:'btn '+c+(mine===v?' on':''),onclick:async()=>{
      const body=clone(m); delete body.id; body.responses=Object.assign({},body.responses||{}); body.responses[state.me.id]=v;
      await guarded(()=>setDoc('meetings',m.id,body));
    }},l)));
  }
  const acts=h('div',{class:'acts'});
  const canEnter=m.open||invited||state.canEdit;
  if(ph==='live'&&canEnter) acts.append(h('button',{class:'btn primary',onclick:()=>enterRoom(m.id)},'เข้าห้องประชุม'));
  else if(ph==='upcoming'&&canEnter) acts.append(h('button',{class:'btn',onclick:()=>enterRoom(m.id)},'เปิดห้องล่วงหน้า'));
  else if((ph==='ended'||ph==='past')&&canEnter) acts.append(h('button',{class:'btn sm',onclick:()=>enterRoom(m.id)},m.notes?'ดูบันทึกการประชุม':'เปิดห้อง'));
  if(safeUrl(m.link)&&ph!=='ended') acts.append(h('a',{class:'btn sm',href:safeUrl(m.link),target:'_blank',rel:'noopener'},'ลิงก์วิดีโอภายนอก'));
  if((isHost||state.canEdit)&&canAct()) acts.append(h('button',{class:'btn ghost sm danger',onclick:async()=>{ if(confirm('ยกเลิกการประชุม "'+m.title+'"?')) await guarded(()=>delDoc('meetings',m.id)); }},'ยกเลิก'));
  return h('div',{class:'card pad meet'},when,
    h('div',{style:'min-width:0'},h('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},ph==='live'?h('span',{class:'live-dot'}):null,h('h3',null,m.title),m.sample?h('span',{class:'chip sample'},'ตัวอย่าง'):null),sub,m.agenda?h('div',{class:'agenda'},m.agenda):null,h('div',{style:'margin-top:8px'},avs),rsvp),
    acts);
}
async function renderMeetForm(ppl){
  const f=ui.meetForm;
  const title=h('input',{id:'mt-title',value:f.title,placeholder:'เช่น ประชุมทีมสรรหาประจำสัปดาห์',oninput:e=>{f.title=e.target.value;}});
  const date=h('input',{id:'mt-date',type:'date',value:f.date,oninput:e=>{f.date=e.target.value;}});
  const time=h('input',{id:'mt-time',type:'time',value:f.time,oninput:e=>{f.time=e.target.value;}});
  const dur=h('select',{id:'mt-dur',onchange:e=>{f.durationMin=Number(e.target.value);}},[15,30,45,60,90,120].map(n=>h('option',{value:n,selected:f.durationMin===n},n+' นาที')));
  const agenda=h('textarea',{id:'mt-agenda',placeholder:'วาระการประชุม (ไม่บังคับ)',oninput:e=>{f.agenda=e.target.value;}},f.agenda);
  const link=h('input',{id:'mt-link',value:f.link,placeholder:'วางลิงก์ Google Meet / Zoom / Teams ตอนนี้ หรือใส่ทีหลังในห้องก็ได้',oninput:e=>{f.link=e.target.value;}});
  const members=Object.entries(state.data.profiles).filter(([id])=>id!==state.me.id&&visibleMember(id)).map(([id,p])=>({id,name:(ppl[id]||{}).name||'สมาชิก HR',title:p.title||''})).sort((a,b)=>a.name.localeCompare(b.name,'th'));
  for(const [id,name] of Object.entries(f.extra)) if(!members.some(m=>m.id===id)) members.push({id,name,title:'จากไดเรกทอรีองค์กร'});
  const pick=h('div',{class:'invitee-pick'},members.length?members.map(m=>h('label',null,h('input',{type:'checkbox',id:'inv-'+m.id,checked:f.invitees.includes(m.id),onchange:e=>{ if(e.target.checked){ if(!f.invitees.includes(m.id)) f.invitees.push(m.id); } else f.invitees=f.invitees.filter(x=>x!==m.id); }}),h('span',null,m.name),h('span',{class:'small muted'},m.title))):h('span',{class:'small muted'},'ยังไม่มีสมาชิกในไดเรกทอรี'));
  let search=null;
  if(state.user){
    const inp=h('input',{id:'mt-search',value:f.q,placeholder:'ค้นหาคนในองค์กรที่ยังไม่มีโปรไฟล์ที่นี่',oninput:async e=>{ f.q=e.target.value; f.hits=await state.user.search(f.q); render(); }});
    const hits=h('div',{class:'skills',style:'margin-top:6px'},f.hits.filter(x=>x.id!==state.me.id&&!f.invitees.includes(x.id)).slice(0,8).map(x=>h('button',{class:'skill btn-like',type:'button',onclick:()=>{ f.extra[x.id]=x.name; if(!f.invitees.includes(x.id)) f.invitees.push(x.id); f.q=''; f.hits=[]; render(); }},'+ ',x.name)));
    search=h('div',{class:'field'},inp,hits);
  }
  const open=h('label',{class:'check'},h('input',{type:'checkbox',id:'mt-open',checked:f.open,onchange:e=>{f.open=e.target.checked;}}),'เปิดให้ทุกคนในแผนกเข้าห้องได้ แม้ไม่ได้รับเชิญ');
  const save=h('button',{class:'btn primary',onclick:async()=>{
    if(!f.title.trim()){ toast('ใส่หัวข้อการประชุม'); return; }
    const ts=new Date(f.date+'T'+(f.time||'09:00')+':00').getTime();
    if(!ts||isNaN(ts)){ toast('เลือกวันและเวลา'); return; }
    save.disabled=true;
    const id=newId('m');
    const ok=await guarded(()=>setDoc('meetings',id,{title:f.title.trim(),agenda:f.agenda.trim(),startAt:ts,durationMin:f.durationMin,hostId:state.me.id,invitees:f.invitees,responses:{},open:f.open,link:safeUrl(f.link),status:'scheduled',notes:'',createdAt:Date.now()}));
    if(ok){ ui.showMeetForm=false; ui.meetForm=null; toast('นัดประชุมแล้ว ผู้ถูกเชิญ '+f.invitees.length+' คนจะเห็นในแท็บประชุม'); render(); } else save.disabled=false;
  }},'บันทึกนัดประชุม');
  return h('div',{class:'card lift pad',style:'margin-bottom:18px'},h('div',{class:'form'},
    field('หัวข้อ',title),
    h('div',{class:'form-row'},field('วันที่',date),h('div',{class:'form-row'},field('เวลา',time),field('ระยะเวลา',dur))),
    field('วาระ',agenda),
    h('div',{class:'field'},h('label',null,'เชิญผู้เข้าร่วม ('+f.invitees.length+' คน)'),pick,search),
    field('ลิงก์ห้องวิดีโอ (ภาพและเสียง)',link),
    open,
    h('div',{class:'form-actions'},h('button',{class:'btn',onclick:()=>{ui.showMeetForm=false;render();}},'ยกเลิก'),save)));
}

/* ---------- live room (presence, chat, video) ---------- */
const live={meetingId:null,myPeer:null,unsubs:[],chat:[],peers:[],stream:null,av:false,cam:false,mic:false,pcs:new Map(),stage:null,tiles:new Map(),chunks:new Map(),names:{},leaseTimer:null,notesTimer:null,linkEditorEl:null};
function enterRoom(id){
  if(state.view==='room'&&state.roomId===id) return;
  if(state.view==='room') roomLeave();
  state.view='room'; state.roomId=id; ui.roomTab='people'; ui.chatDraft=''; ui.notesEdit=null;
  roomJoin(id); window.scrollTo({top:0}); render();
}
// ห้องเรียลไทม์ต่อการประชุมหนึ่งห้อง สร้างบน Supabase Realtime (presence + broadcast)
function makeRoom(mid){
  const peerId=Math.random().toString(36).slice(2,10);
  const ch=sb.channel('meeting-'+mid,{config:{presence:{key:peerId},broadcast:{self:true}}});
  let connected=false, lastPeers=[]; const peersHandlers=[]; const myPresence={};
  function snapshot(){
    const st=ch.presenceState(); const out=[];
    for(const [key,metas] of Object.entries(st)){
      const meta=metas[metas.length-1]||{};
      out.push({peer:key,by:meta.uid||null,isMe:meta.uid===state.me.id,sameTab:key===peerId,kind:'viewer',presence:meta,updatedAt:Date.now()});
    }
    return out;
  }
  function fire(){
    const now=snapshot(); const prevKeys=new Set(lastPeers.map(p=>p.peer)); const nowKeys=new Set(now.map(p=>p.peer));
    const change={peers:now,joined:now.filter(p=>!prevKeys.has(p.peer)),left:lastPeers.filter(p=>!nowKeys.has(p.peer)),updated:now.filter(p=>prevKeys.has(p.peer))};
    lastPeers=now; for(const hnd of peersHandlers){ try{ hnd(change); }catch(e){ console.error(e); } }
  }
  ch.on('presence',{event:'sync'},fire);
  async function track(){ if(connected) await ch.track(Object.assign({uid:state.me.id},myPresence)); }
  return {
    peers(){ return lastPeers; },
    onPeers(hnd){ peersHandlers.push(hnd); return ()=>{ const i=peersHandlers.indexOf(hnd); if(i>=0) peersHandlers.splice(i,1); }; },
    on(topic,hnd){
      ch.on('broadcast',{event:topic},({payload})=>{ const p=payload||{}; hnd({topic,data:p.data,peer:p.from,by:p.uid||null,isMe:p.uid===state.me.id,sameTab:p.from===peerId,kind:'viewer'}); });
      return ()=>{};
    },
    async emit(topic,data){ if(!connected) return; await ch.send({type:'broadcast',event:topic,payload:{data,from:peerId,uid:state.me.id}}); },
    async presence(patch){ for(const [k,v] of Object.entries(patch)){ if(v===null) delete myPresence[k]; else myPresence[k]=v; } await track(); },
    connected(){ return connected; },
    connect(){ ch.subscribe(async status=>{ if(status==='SUBSCRIBED'){ connected=true; await track(); } else if(status==='CLOSED'||status==='CHANNEL_ERROR'||status==='TIMED_OUT'){ connected=false; } }); },
    close(){ connected=false; try{ sb.removeChannel(ch); }catch(_){} }
  };
}
function roomJoin(mid){
  live.meetingId=mid; live.chat=[]; live.peers=[]; live.myPeer=null;
  state.room=(state.live&&sb)?makeRoom(mid):null;
  const room=state.room; if(!room) return;
  live.unsubs.push(room.onPeers(ch=>{
    const me=ch.peers.find(p=>p.isMe&&p.sameTab); if(me) live.myPeer=me.peer;
    live.peers=ch.peers.filter(p=>p.kind==='viewer'&&p.presence&&p.presence.meeting===live.meetingId);
    for(const p of ch.left) dropPeer(p.peer,false);
    negotiateAll();
    for(const [peer] of live.pcs) if(!live.peers.some(p=>p.peer===peer&&p.presence.av)) dropPeer(peer,false);
    render(); updateStage();
  },()=>{ live.peers=[]; render(); }));
  live.unsubs.push(room.on('chat',msg=>{
    const d=msg.data; if(!d||typeof d!=='object'||d.mid!==live.meetingId) return;
    live.chat.push({uid:typeof d.uid==='string'?d.uid:'',text:String(d.text||'').slice(0,1000),at:Date.now(),me:!!msg.isMe});
    if(live.chat.length>200) live.chat.shift();
    render();
  }));
  live.unsubs.push(room.on('signal',onSignal));
  room.presence({uid:state.me.id||'',meeting:mid,av:false,cam:false,mic:false}).catch(()=>{});
  room.connect();
}
function roomLeave(){
  leaveAV(false);
  for(const u of live.unsubs){ try{u();}catch(_){} } live.unsubs=[];
  if(state.room){ state.room.close(); state.room=null; }
  clearInterval(live.leaseTimer); live.leaseTimer=null; clearTimeout(live.notesTimer); live.notesTimer=null;
  live.meetingId=null; live.stage=null; live.tiles=new Map(); live.chat=[]; live.peers=[]; live.chunks=new Map(); live.linkEditorEl=null;
  state.roomId=null; ui.notesEdit=null; ui.linkEdit=false;
}
function shouldOffer(peer){ return !!live.myPeer&&live.myPeer<peer; }
function negotiateAll(){
  if(!live.av) return;
  for(const p of live.peers){
    if(p.isMe&&p.sameTab) continue; if(!p.presence.av) continue;
    const e=live.pcs.get(p.peer);
    if(shouldOffer(p.peer)&&!(e&&e.offered)) makeOffer(p.peer);
  }
}
function createPC(peer){
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  const e={pc,peer,stream:new MediaStream(),pendingIce:[],iceBuf:[],iceTimer:null,offered:false};
  live.pcs.set(peer,e);
  if(live.stream) for(const t of live.stream.getTracks()) pc.addTrack(t,live.stream);
  else { try{ pc.addTransceiver('audio',{direction:'recvonly'}); pc.addTransceiver('video',{direction:'recvonly'}); }catch(_){} }
  pc.ontrack=ev=>{ e.stream.addTrack(ev.track); ev.track.onended=()=>updateStage(); updateStage(); };
  pc.onicecandidate=ev=>{ if(!ev.candidate) return; e.iceBuf.push(ev.candidate.toJSON()); if(!e.iceTimer) e.iceTimer=setTimeout(()=>flushIceOut(e),250); };
  pc.onconnectionstatechange=()=>{ if(pc.connectionState==='failed') dropPeer(peer,false); updateStage(); };
  return e;
}
function flushIceOut(e){ e.iceTimer=null; const cands=e.iceBuf.splice(0,12); if(cands.length) sendSignal({to:e.peer,kind:'ice',cands}); if(e.iceBuf.length) e.iceTimer=setTimeout(()=>flushIceOut(e),250); }
function sendSignal(d){ const room=state.room; if(!room||!live.myPeer||!live.meetingId) return; room.emit('signal',Object.assign({mid:live.meetingId,from:live.myPeer},d)).catch(err=>{ if(err&&err.code==='not_permitted') toast('บัญชีของคุณส่งสัญญาณวิดีโอไม่ได้ (สิทธิ์ดูอย่างเดียว)'); }); }
function sendSdp(to,type,sdp){ const id=Math.random().toString(36).slice(2,8); const size=2400; const n=Math.ceil(sdp.length/size)||1; for(let i=0;i<n;i++) sendSignal({to,kind:'sdp',type,id,i,n,part:sdp.slice(i*size,(i+1)*size)}); }
async function makeOffer(peer){
  const e=live.pcs.get(peer)||createPC(peer); if(e.offered) return; e.offered=true;
  try{ const offer=await e.pc.createOffer(); await e.pc.setLocalDescription(offer); sendSdp(peer,'offer',e.pc.localDescription.sdp); }
  catch(err){ console.error(err); e.offered=false; }
}
function onSignal(msg){
  const d=msg.data; if(!d||typeof d!=='object'||msg.sameTab) return;
  if(d.mid!==live.meetingId||d.to!==live.myPeer||typeof d.from!=='string') return;
  if(!live.av&&d.kind!=='bye') return;
  if(d.kind==='sdp'){
    const n=Number(d.n)||1, i=Number(d.i)||0; if(i<0||i>=n||n>20) return;
    const key=d.from+':'+d.id; let c=live.chunks.get(key); if(!c){ c={parts:new Array(n),got:0,t:Date.now()}; live.chunks.set(key,c); }
    if(c.parts[i]==null){ c.parts[i]=String(d.part||''); c.got++; }
    if(c.got===n){ live.chunks.delete(key); handleSdp(d.from,d.type,c.parts.join('')); }
  } else if(d.kind==='ice'){
    const e=live.pcs.get(d.from)||createPC(d.from);
    const cands=Array.isArray(d.cands)?d.cands:[];
    if(e.pc.remoteDescription) for(const c of cands) e.pc.addIceCandidate(c).catch(()=>{}); else e.pendingIce.push(...cands);
  } else if(d.kind==='bye'){ dropPeer(d.from,false); }
}
async function handleSdp(from,type,sdp){
  try{
    if(type==='offer'){
      const e=live.pcs.get(from)||createPC(from);
      if(e.pc.signalingState!=='stable'){ if(shouldOffer(from)) return; await e.pc.setLocalDescription({type:'rollback'}).catch(()=>{}); }
      await e.pc.setRemoteDescription({type:'offer',sdp});
      for(const c of e.pendingIce.splice(0)) e.pc.addIceCandidate(c).catch(()=>{});
      const ans=await e.pc.createAnswer(); await e.pc.setLocalDescription(ans);
      sendSdp(from,'answer',e.pc.localDescription.sdp);
    } else if(type==='answer'){
      const e=live.pcs.get(from); if(!e||e.pc.signalingState!=='have-local-offer') return;
      await e.pc.setRemoteDescription({type:'answer',sdp});
      for(const c of e.pendingIce.splice(0)) e.pc.addIceCandidate(c).catch(()=>{});
    }
  }catch(err){ console.error('sdp',err); }
}
function dropPeer(peer,notify){
  const e=live.pcs.get(peer); if(!e) return;
  if(notify) sendSignal({to:peer,kind:'bye'});
  clearTimeout(e.iceTimer); try{ e.pc.close(); }catch(_){}
  live.pcs.delete(peer); live.tiles.delete(peer); updateStage();
}
async function joinAV(){
  if(!state.room){ toast('ห้องสดใช้ได้เมื่อเปิดผ่านระบบภายในของแผนก'); return; }
  let stream=null;
  const md=navigator.mediaDevices;
  if(md&&md.getUserMedia){
    try{ stream=await md.getUserMedia({video:{width:{ideal:640},height:{ideal:480}},audio:true}); }
    catch(e1){
      try{ stream=await md.getUserMedia({audio:true}); toast('เปิดกล้องไม่ได้ เข้าร่วมด้วยเสียงอย่างเดียว'); }
      catch(e2){ console.warn(e1,e2); }
    }
  }
  if(!stream){ if(!confirm('เบราว์เซอร์ไม่อนุญาตให้ใช้กล้องและไมค์ในหน้านี้\nเข้าร่วมแบบรับชมและฟังอย่างเดียวแทนหรือไม่?')) return; }
  live.stream=stream; live.av=true;
  live.cam=!!(stream&&stream.getVideoTracks().length); live.mic=!!(stream&&stream.getAudioTracks().length);
  for(const e of live.pcs.values()){ dropPeer(e.peer,true); }
  state.room.presence({av:true,cam:live.cam,mic:live.mic}).catch(()=>{});
  negotiateAll(); updateStage(); render();
}
function leaveAV(rerender){
  for(const e of Array.from(live.pcs.values())) dropPeer(e.peer,true);
  if(live.stream) for(const t of live.stream.getTracks()) t.stop();
  live.stream=null; live.av=false; live.cam=false; live.mic=false; live.tiles=new Map();
  if(state.room&&live.meetingId) state.room.presence({av:false,cam:false,mic:false}).catch(()=>{});
  if(rerender){ updateStage(); render(); }
}
function toggleTrack(kind){
  if(!live.stream) return;
  const tracks=kind==='cam'?live.stream.getVideoTracks():live.stream.getAudioTracks();
  if(!tracks.length){ toast(kind==='cam'?'ไม่มีกล้องในเซสชันนี้':'ไม่มีไมค์ในเซสชันนี้'); return; }
  const on=!tracks[0].enabled; for(const t of tracks) t.enabled=on;
  if(kind==='cam') live.cam=on; else live.mic=on;
  state.room.presence({cam:live.cam,mic:live.mic}).catch(()=>{});
  updateStage();
}
function captureAllowed(){
  if(!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!=='function') return false;
  const pp=document.permissionsPolicy||document.featurePolicy;
  if(pp&&typeof pp.allowsFeature==='function'){ try{ return pp.allowsFeature('camera')||pp.allowsFeature('microphone'); }catch(_){ return true; } }
  return true;
}
function linkEditor(m){
  if(live.linkEditorEl) return live.linkEditorEl;
  const inp=h('input',{id:'link-input',placeholder:'วางลิงก์ห้องวิดีโอที่นี่ เช่น https://meet.google.com/abc-defg-hij',value:safeUrl(m.link)||'',style:'flex:1;min-width:220px;border:1px solid #34424f;border-radius:8px;padding:8px 11px;background:#0b1117;color:#fff'});
  const save=h('button',{class:'btn join',onclick:async()=>{
    const v=safeUrl(inp.value); if(!v){ toast('ลิงก์ต้องขึ้นต้นด้วย https://'); return; }
    save.disabled=true;
    const ok=await guarded(()=>updateDoc('meetings',m.id,{link:v}));
    if(ok){ ui.linkEdit=false; live.linkEditorEl=null; toast('บันทึกลิงก์แล้ว ทุกคนในห้องเห็นปุ่มเข้าร่วมวิดีโอ'); render(); } else save.disabled=false;
  }},'บันทึกลิงก์');
  live.linkEditorEl=h('div',{style:'display:flex;flex-direction:column;gap:8px;padding:0 8px 8px'},
    h('div',{class:'controls',style:'justify-content:flex-start'},
      h('span',{style:'color:#c9d1d9;font-size:13px;align-self:center'},'ยังไม่มีห้อง? สร้างใหม่แล้วคัดลอกลิงก์มาวาง:'),
      h('a',{class:'btn',href:'https://meet.google.com/new',target:'_blank',rel:'noopener'},'Google Meet ใหม่'),
      h('a',{class:'btn',href:'https://zoom.us/start/videomeeting',target:'_blank',rel:'noopener'},'Zoom ใหม่')),
    h('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},inp,save));
  return live.linkEditorEl;
}
function getStage(){ if(!live.stage) live.stage=h('div',{class:'stage'}); return live.stage; }
function tileFor(key,stream,opts){
  let t=live.tiles.get(key);
  if(!t){
    const video=h('video',{autoplay:true,playsinline:true,muted:opts.self?true:null});
    video.muted=!!opts.self;
    const el=h('div',{class:'tile'},video,h('span',{class:'avatar'}),h('span',{class:'nm'}));
    t={el,video}; live.tiles.set(key,t);
  }
  if(t.video.srcObject!==stream) t.video.srcObject=stream;
  const p=opts.person||{name:'สมาชิก HR',color:'#6b7b86'};
  const av=t.el.querySelector('.avatar'); av.style.background=p.color||'#6b7b86'; av.textContent=initials(p.name);
  const nm=t.el.querySelector('.nm'); nm.replaceChildren(h('span',null,(opts.self?'คุณ · ':'')+p.name),h('span',{class:'off',style:'font-size:11px'},opts.mic===false?'ปิดไมค์':''));
  t.el.classList.toggle('novideo',!opts.cam);
  t.el.classList.toggle('mirror',!!opts.self);
  return t.el;
}
function updateStage(){
  if(state.view!=='room'||!live.meetingId) return;
  const st=getStage();
  const m=state.data.meetings[live.meetingId]||{};
  const ph=meetPhase(m);
  const kids=[];
  if(!state.room){
    kids.push(h('div',{class:'stage-empty'},h('b',null,'ห้องสดใช้ได้เมื่อเปิดผ่านระบบภายในของแผนก'),'โหมดสาธิตแสดงเฉพาะรายการประชุม วาระ และบันทึกการประชุม'));
  } else if(ph==='ended'){
    kids.push(h('div',{class:'stage-empty'},h('b',null,'การประชุมจบแล้ว'),'ดูบันทึกการประชุมได้ที่แผงด้านขวา'));
  } else if(!live.av&&!captureAllowed()){
    const link=safeUrl(m.link);
    kids.push(h('div',{class:'stage-empty'},h('b',null,link?'ภาพและเสียงใช้ห้องวิดีโอตามลิงก์ด้านล่าง':'ห้องนี้ยังไม่มีลิงก์วิดีโอ'),
      'เบราว์เซอร์ไม่อนุญาตให้หน้านี้ใช้กล้องและไมค์โดยตรง จึงเปิดภาพและเสียงผ่าน Google Meet, Zoom หรือ Teams แทน โดยไม่ต้องส่งอีเมลเชิญ เพราะทุกคนในห้องนี้เห็นลิงก์เดียวกัน ส่วนรายชื่อผู้เข้าร่วม แชท และบันทึกการประชุมอยู่ที่นี่'));
    const ctl=h('div',{class:'controls'});
    if(link) ctl.append(h('a',{class:'btn join',href:link,target:'_blank',rel:'noopener'},'เข้าร่วมวิดีโอ'));
    if(canAct()) ctl.append(h('button',{class:'btn',onclick:()=>{ ui.linkEdit=!ui.linkEdit; live.linkEditorEl=null; updateStage(); }},ui.linkEdit?'ปิดช่องใส่ลิงก์':link?'เปลี่ยนลิงก์วิดีโอ':'ใส่ลิงก์วิดีโอ'));
    kids.push(ctl);
    if(ui.linkEdit&&canAct()) kids.push(linkEditor(m));
  } else if(!live.av){
    const n=live.peers.filter(p=>p.presence.av).length;
    kids.push(h('div',{class:'stage-empty'},h('b',null,n?n+' คนกำลังอยู่ในสายวิดีโอ':'ยังไม่มีใครเปิดวิดีโอ'),'กด "เข้าร่วมเสียงและวิดีโอ" เบราว์เซอร์จะขออนุญาตใช้กล้องและไมค์ ถ้าไม่อนุญาตยังเข้าร่วมแบบรับชมได้ ระหว่างนี้ใช้แชทและบันทึกด้านขวาได้เลย'));
    if(canAct()) kids.push(h('div',{class:'controls'},h('button',{class:'btn join',onclick:joinAV},'เข้าร่วมเสียงและวิดีโอ')));
    else kids.push(h('div',{class:'stage-empty',style:'padding-top:0'},'บัญชีที่มีสิทธิ์ดูอย่างเดียวเข้าสายวิดีโอไม่ได้'));
  } else {
    const tiles=h('div',{class:'tiles'});
    const meP=live.names[state.me.id]||{name:state.me.name||'คุณ',color:state.me.color};
    tiles.append(tileFor('me',live.stream,{self:true,person:meP,cam:live.cam,mic:live.mic}));
    for(const [peer,e] of live.pcs){
      const pr=live.peers.find(p=>p.peer===peer); const pres=pr?pr.presence:{};
      const person=live.names[pres.uid]||{name:'สมาชิก HR',color:'#6b7b86'};
      const hasVideo=e.stream.getVideoTracks().some(t=>t.readyState==='live')&&pres.cam!==false;
      tiles.append(tileFor(peer,e.stream,{person,cam:hasVideo,mic:pres.mic!==false}));
    }
    kids.push(tiles);
    kids.push(h('div',{class:'controls'},
      h('button',{class:'btn'+(live.mic?'':' off'),onclick:()=>toggleTrack('mic')},live.mic?'ปิดไมค์':'เปิดไมค์'),
      h('button',{class:'btn'+(live.cam?'':' off'),onclick:()=>toggleTrack('cam')},live.cam?'ปิดกล้อง':'เปิดกล้อง'),
      h('button',{class:'btn leave',onclick:()=>leaveAV(true)},'ออกจากสาย')));
  }
  st.replaceChildren(...kids);
}
async function renderRoom(){
  const raw=state.data.meetings[state.roomId];
  if(!raw) return h('div',{class:'card pad'},h('div',{class:'empty-note'},'ไม่พบการประชุมนี้ อาจถูกยกเลิกไปแล้ว'),h('button',{class:'btn sm',onclick:()=>go('meetings')},'กลับไปรายการประชุม'));
  const m=Object.assign({id:state.roomId},raw); const ph=meetPhase(m);
  const isHost=m.hostId===state.me.id;
  const ids=[m.hostId,...(m.invitees||[]),state.me.id,...live.peers.map(p=>p.presence.uid).filter(x=>typeof x==='string'),...live.chat.map(c=>c.uid)];
  const ppl=await people(ids); live.names=ppl;
  const host=ppl[m.hostId]||{name:'สมาชิก HR'};
  const head=h('div',{class:'room-head'},
    h('div',{class:'t'},h('button',{class:'btn ghost sm',style:'padding-left:0',onclick:()=>go('meetings')},'← รายการประชุม'),
      h('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},ph==='live'?h('span',{class:'live-dot'}):null,h('h2',null,m.title)),
      h('div',{class:'sub'},h('span',null,dayLabel(m.startAt)+' '+fmtTime(m.startAt)+' – '+fmtTime(meetEnd(m))),h('span',null,'ผู้จัด '+host.name),h('span',null,ph==='ended'?'จบแล้ว':ph==='live'?'เปิดห้องอยู่':ph==='upcoming'?'ยังไม่ถึงเวลา':'เลยเวลาแล้ว'))),
    h('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},
      safeUrl(m.link)?h('a',{class:'btn sm',href:safeUrl(m.link),target:'_blank',rel:'noopener'},'ลิงก์วิดีโอภายนอก'):null,
      (isHost||state.canEdit)&&canAct()&&ph!=='ended'?h('button',{class:'btn sm',onclick:async()=>{ if(confirm('จบการประชุมสำหรับทุกคน?')){ const ok=await guarded(()=>updateDoc('meetings',m.id,{status:'ended',endedAt:Date.now()})); if(ok){ leaveAV(true); } } }},'จบการประชุม'):null));
  const stage=getStage(); updateStage();
  const left=h('div',null,stage,m.agenda?h('div',{class:'card pad agenda-box'},h('span',{class:'eyebrow'},'วาระ'),h('p',null,m.agenda)):null);
  const tabs=[['people','ผู้เข้าร่วม ('+live.peers.length+')'],['chat','แชท'+(live.chat.length?' ('+live.chat.length+')':'')],['notes','บันทึก']];
  const panel=h('div',{class:'card'},
    h('div',{class:'panel-tabs',role:'tablist'},tabs.map(([k,l])=>h('button',{role:'tab','aria-selected':ui.roomTab===k?'true':'false',onclick:()=>{ui.roomTab=k;render();}},l))),
    h('div',{class:'panel-body'},ui.roomTab==='people'?renderPresence(m,ppl):ui.roomTab==='chat'?renderChat(ppl):renderNotes(m,ppl)));
  return h('div',null,head,h('div',{class:'room'},left,panel));
}
function renderPresence(m,ppl){
  const here=live.peers.map(p=>p.presence.uid).filter(x=>typeof x==='string');
  const rows=[];
  const seen=new Set();
  for(const p of live.peers){
    const uid=p.presence.uid; const person=ppl[uid]||{name:'สมาชิก HR',color:'#6b7b86'};
    const key=uid||p.peer; if(seen.has(key)) continue; seen.add(key);
    rows.push(h('div',{class:'person-row'},avatar(person,32),h('div',{class:'txt'},h('b',{onclick:()=>{ if(uid) go('profile',uid); }},person.name+(p.isMe?' (คุณ)':'')),h('span',null,p.presence.av?(p.presence.cam?'กล้องเปิด':'เสียงอย่างเดียว')+(p.presence.mic===false?' · ปิดไมค์':''):'อยู่ในห้อง ยังไม่เข้าสาย')),uid===m.hostId?h('span',{class:'chip'},'ผู้จัด'):null));
  }
  const resp=m.responses||{};
  const absent=[m.hostId,...(m.invitees||[])].filter(id=>!here.includes(id));
  const absentRows=absent.map(id=>{ const person=ppl[id]||{name:'สมาชิก HR',color:'#6b7b86'}; const r=resp[id]; return h('div',{class:'person-row',style:'opacity:.7'},avatar(person,32),h('div',{class:'txt'},h('b',{onclick:()=>go('profile',id)},person.name),h('span',null,id===m.hostId?'ผู้จัด · ยังไม่เข้าห้อง':r==='accept'?'ตอบรับแล้ว · ยังไม่เข้าห้อง':r==='decline'?'ไม่สะดวก':r==='maybe'?'ไม่แน่ใจ':'ยังไม่ตอบรับ'))); });
  return h('div',null,
    h('div',{class:'eyebrow',style:'margin-bottom:8px'},'อยู่ในห้องตอนนี้'),
    rows.length?h('div',{class:'present'},rows):h('div',{class:'empty-note'},state.room?'ยังไม่มีใครอยู่ในห้อง':'ต้องเปิดผ่านระบบภายในของแผนกจึงจะเห็นว่าใครอยู่ในห้อง'),
    absentRows.length?h('div',{style:'margin-top:16px'},h('div',{class:'eyebrow',style:'margin-bottom:8px'},'ผู้ได้รับเชิญ'),h('div',{class:'present'},absentRows)):null);
}
function renderChat(ppl){
  const log=h('div',{class:'chat-log',id:'chat-log'},live.chat.length?live.chat.map(c=>{ const p=ppl[c.uid]||{name:'สมาชิก HR'}; return h('div',{class:'chat-msg'+(c.me?' me':'')},h('b',null,c.me?'คุณ':p.name),h('span',null,c.text),h('span',{class:'t'},fmtTime(c.at))); }):h('div',{class:'empty-note'},'แชทในห้องเห็นเฉพาะคนที่อยู่ในห้องขณะนี้ และไม่ถูกเก็บไว้หลังจบประชุม สิ่งที่ต้องเก็บให้เขียนในแท็บ "บันทึก"'));
  const can=!!state.room&&canAct();
  const inp=h('input',{id:'chat-input',placeholder:can?'พิมพ์ข้อความแล้วกด Enter':'ต้องเปิดผ่านระบบภายในของแผนกจึงจะแชทได้',disabled:!can,value:ui.chatDraft,oninput:e=>{ui.chatDraft=e.target.value;},onkeydown:e=>{ if(e.key==='Enter'){ e.preventDefault(); sendChat(); } }});
  const btn=h('button',{class:'btn sm primary',disabled:!can,onclick:sendChat},'ส่ง');
  setTimeout(()=>{ const el=document.getElementById('chat-log'); if(el) el.scrollTop=el.scrollHeight; },0);
  return h('div',{style:'display:flex;flex-direction:column;flex:1'},log,h('div',{class:'chat-form'},inp,btn));
}
function sendChat(){
  const text=ui.chatDraft.trim(); if(!text||!state.room) return;
  if(!state.room.connected()){ toast('ยังไม่ได้เชื่อมต่อห้อง ลองอีกครั้ง'); return; }
  state.room.emit('chat',{mid:live.meetingId,uid:state.me.id||'',text:text.slice(0,1000)}).then(()=>{ ui.chatDraft=''; const el=document.getElementById('chat-input'); if(el) el.value=''; }).catch(err=>{ toast(err&&err.code==='not_permitted'?'บัญชีของคุณส่งแชทไม่ได้ (สิทธิ์ดูอย่างเดียว)':'ส่งไม่สำเร็จ ลองอีกครั้ง'); });
}
function renderNotes(m,ppl){
  const can=canAct();
  if(ui.notesEdit){
    const ta=h('textarea',{id:'notes-ta',oninput:e=>{ ui.notesEdit.text=e.target.value; clearTimeout(live.notesTimer); live.notesTimer=setTimeout(()=>saveNotes(m.id,false),1500); }},ui.notesEdit.text);
    return h('div',{class:'notes'},h('div',{class:'lock'},h('span',null,'คุณกำลังแก้ไข บันทึกอัตโนมัติเมื่อหยุดพิมพ์'),h('div',{style:'display:flex;gap:6px'},h('button',{class:'btn sm primary',onclick:()=>saveNotes(m.id,true)},'เสร็จสิ้น'))),ta);
  }
  const stale=!m.editingAt||Date.now()-m.editingAt>2*MIN;
  const editor=m.editingBy&&!stale?(ppl[m.editingBy]||{name:'สมาชิก HR'}).name:null;
  return h('div',{class:'notes'},
    h('div',{class:'lock'},h('span',null,editor?'กำลังแก้ไขโดย '+editor:m.notesAt?'แก้ไขล่าสุด '+ago(m.notesAt)+(m.notesBy&&ppl[m.notesBy]?' โดย '+ppl[m.notesBy].name:''):'บันทึกการประชุมเห็นร่วมกันทุกคน และคงอยู่หลังจบประชุม'),can?h('button',{class:'btn sm',disabled:!!editor&&m.editingBy!==state.me.id,onclick:()=>startNotesEdit(m)},'แก้ไขบันทึก'):null),
    m.notes?h('pre',null,m.notes):h('div',{class:'empty-note'},'ยังไม่มีบันทึก ใส่ข้อสรุป มติ และงานที่ต้องทำต่อ พร้อมชื่อผู้รับผิดชอบ'));
}
async function startNotesEdit(m){
  if(state.live){
    const busy=m.editingBy&&m.editingBy!==state.me.id&&Date.now()-(m.editingAt||0)<2*MIN;
    if(busy){ toast('มีคนอื่นกำลังแก้ไขบันทึกอยู่ ลองใหม่ในอีกสักครู่'); return; }
    const ok=await guarded(()=>updateDoc('meetings',m.id,{editingBy:state.me.id,editingAt:Date.now()}));
    if(!ok) return;
    clearInterval(live.leaseTimer);
    live.leaseTimer=setInterval(()=>{ if(!ui.notesEdit) return clearInterval(live.leaseTimer); updateDoc('meetings',m.id,{editingAt:Date.now()}).catch(()=>{}); },40000);
  }
  ui.notesEdit={text:m.notes||''}; render();
}
async function saveNotes(mid,finish){
  if(!ui.notesEdit) return;
  clearTimeout(live.notesTimer);
  const text=ui.notesEdit.text;
  const patch={notes:text,notesBy:state.me.id,notesAt:Date.now()};
  if(finish){ patch.editingBy=null; patch.editingAt=null; }
  const ok=await guarded(()=>updateDoc('meetings',mid,patch));
  if(ok&&finish){ ui.notesEdit=null; clearInterval(live.leaseTimer); live.leaseTimer=null; toast('บันทึกแล้ว'); render(); }
}
window.addEventListener('pagehide',()=>{ try{ leaveAV(false); }catch(_){} });

/* ---------- direct messages (end-to-end encrypted) + notifications ---------- */
let audioCtx=null;
function beep(){
  if(!audioCtx||audioCtx.state!=='running') return;
  try{ const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=880; g.gain.value=0.06; o.connect(g); g.connect(audioCtx.destination); o.start(); o.frequency.setValueAtTime(660,audioCtx.currentTime+0.12); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.3); o.stop(audioCtx.currentTime+0.3); }catch(_){}
}
const B64={enc:b=>{ const a=new Uint8Array(b); let s=''; for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return btoa(s); },dec:s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
const ECDH={name:'ECDH',namedCurve:'P-256'};
async function genKeys(){ const kp=await crypto.subtle.generateKey(ECDH,true,['deriveKey']); return {priv:await crypto.subtle.exportKey('jwk',kp.privateKey),pub:await crypto.subtle.exportKey('jwk',kp.publicKey)}; }
function importPriv(jwk){ return crypto.subtle.importKey('jwk',jwk,ECDH,false,['deriveKey']); }
function importPub(jwk){ const j={kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y,ext:true}; return crypto.subtle.importKey('jwk',j,ECDH,false,[]); }
async function sharedKey(priv,pubJwk){ const pub=await importPub(pubJwk); return crypto.subtle.deriveKey({name:'ECDH',public:pub},priv,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
async function encMsg(key,text){ const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text)); return {iv:B64.enc(iv),c:B64.enc(ct)}; }
async function decMsg(key,m){ try{ const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:B64.dec(m.iv)},key,B64.dec(m.c)); return new TextDecoder().decode(pt); }catch(_){ return null; } }
function convId(a,b){ return [a,b].sort().join('__'); }
function otherOf(c){ return (c.parts||[]).find(x=>x!==state.me.id)||''; }
function convUnread(c){ const me=state.me.id; const s=(c.seen&&c.seen[me])||0; return (c.msgs||[]).filter(m=>m.f!==me&&(m.t||0)>s).length; }
function myConvs(){ const me=state.me.id; return Object.entries(state.data.dm).map(([id,c])=>Object.assign({id},c)).filter(c=>Array.isArray(c.parts)&&c.parts.includes(me)); }
function dmUnreadTotal(){ let n=0; for(const c of myConvs()) n+=convUnread(c); return n; }
async function initDM(){
  const me=state.me.id; if(!me||!state.live||!(window.crypto&&crypto.subtle)) return;
  try{
    let k=await privateGet('keys');
    if(!k||!k.priv||!k.pub){ k=await genKeys(); k.createdAt=Date.now(); await privateSet('keys',k); }
    state.dm.priv=await importPriv(k.priv); state.dm.pub=k.pub;
    const prof=myProfile(); const cur=prof&&prof.pubKey;
    if(!prof) await setDoc('profiles',me,{name:state.me.name,title:'',team:'',location:'',bio:'',skills:[],experience:[],certs:[],following:[],pubKey:k.pub,updatedAt:Date.now()});
    else if(!cur||cur.x!==k.pub.x||cur.y!==k.pub.y) await updateDoc('profiles',me,{pubKey:k.pub});
    state.dm.ready=true; render();
  }catch(e){ console.warn('dm init',e); state.dm.ready=false; }
}
async function getKeyFor(other){
  if(!state.live) return 'plain';
  if(!state.dm.priv) return null;
  const prof=profileOf(other); const pub=prof&&prof.pubKey; if(!pub||!pub.x||!pub.y) return null;
  const sig=pub.x+'.'+pub.y; const cached=state.dm.derived.get(other); if(cached&&cached.sig===sig) return cached.key;
  const key=await sharedKey(state.dm.priv,pub).catch(()=>null); state.dm.derived.set(other,{sig,key}); return key;
}
async function plainText(m,other){
  if(m.sys==='call') return callLogText(m);
  if(m.plain) return String(m.text||'');
  const ck=other+':'+(m.t||0)+':'+String(m.c||'').slice(0,24);
  if(state.dm.cache.has(ck)) return state.dm.cache.get(ck);
  const key=await getKeyFor(other); if(!key||key==='plain') return null;
  const t=await decMsg(key,m); if(t!=null) state.dm.cache.set(ck,t); return t;
}
async function sendDM(other,text){
  const me=state.me.id; if(!me||other===me) return false;
  const key=await getKeyFor(other); if(!key){ toast('อีกฝ่ายยังไม่เคยเปิด Crew Room จึงยังไม่มีกุญแจสำหรับรับข้อความ'); return false; }
  const msg=key==='plain'?{f:me,t:Date.now(),plain:true,text}:Object.assign({f:me,t:Date.now()},await encMsg(key,text));
  const id=convId(me,other); const cur=state.data.dm[id];
  const msgs=cur?clone(cur.msgs||[]):[]; msgs.push(msg); while(msgs.length>300) msgs.shift();
  const now=Date.now();
  if(cur) await updateDoc('dm',id,{msgs,lastAt:now,lastFrom:me,seen:{[me]:now}});
  else await setDoc('dm',id,{parts:[me,other],msgs,lastAt:now,lastFrom:me,seen:{[me]:now},createdAt:now});
  return true;
}
let seenTimer=null;
function markSeen(id){
  const c=state.data.dm[id]; const me=state.me.id; if(!c||!me||!convUnread(c)) return;
  clearTimeout(seenTimer);
  seenTimer=setTimeout(()=>{ updateDoc('dm',id,{seen:{[me]:Date.now()}}).catch(()=>{}); },400);
}
function openChat(uid){
  if(!uid) return; if(uid===state.me.id){ toast('นี่คือโปรไฟล์ของคุณเอง'); return; }
  ui.chatWith=uid; ui.panel=null; ui.dmDraft=''; ui.dmSearch='';
  markSeen(convId(state.me.id,uid)); render();
  setTimeout(()=>{ const el=document.getElementById('dm-input'); if(el) el.focus(); },50);
}
async function submitDM(){
  const text=ui.dmDraft.trim(); if(!text||!ui.chatWith) return;
  const other=ui.chatWith;
  const ok=await guarded(()=>sendDM(other,text.slice(0,2000)));
  if(ok){ ui.dmDraft=''; const el=document.getElementById('dm-input'); if(el) el.value=''; render(); }
}
async function notifyNewDM(other){
  const ppl=await people([other]); const p=ppl[other]||{name:'สมาชิก HR'};
  toast('ข้อความใหม่จาก '+p.name); beep();
}
function buildNotifs(){
  const me=state.me.id; if(!me) return []; const out=[];
  for(const c of myConvs()) for(const m of (c.msgs||[])) if(m.sys==='call'&&m.f!==me&&m.status==='missed') out.push({type:'call',fromId:m.f,at:m.t||0,text:'โทรหาคุณ แต่คุณไม่ได้รับสาย',preview:m.kind==='video'?'วิดีโอคอล':'สายเสียง',ref:{view:'chat',with:m.f}});
  for(const [pid,p] of Object.entries(state.data.posts)){
    if(p.authorId!==me) continue;
    for(const c of (p.comments||[])) if(c.authorId&&c.authorId!==me) out.push({type:'comment',fromId:c.authorId,at:c.createdAt||0,text:'แสดงความคิดเห็นในโพสต์ของคุณ',preview:c.text,ref:{view:'feed',post:pid}});
    for(const [uid,ts] of Object.entries(p.likedAt||{})) if(uid!==me) out.push({type:'like',fromId:uid,at:ts,text:'ถูกใจโพสต์ของคุณ',preview:(p.text||'').slice(0,70),ref:{view:'feed',post:pid}});
  }
  const e=state.data.endorsements[me];
  if(e&&e.at) for(const [skill,m] of Object.entries(e.at)) for(const [uid,ts] of Object.entries(m||{})) if(uid!==me) out.push({type:'endorse',fromId:uid,at:ts,text:'รับรองทักษะ "'+skill+'" ของคุณ',ref:{view:'profile'}});
  for(const m of Object.values(state.data.meetings)) if(m.hostId&&m.hostId!==me&&(m.invitees||[]).includes(me)) out.push({type:'meet',fromId:m.hostId,at:m.createdAt||m.startAt||0,text:'เชิญคุณเข้าประชุม "'+m.title+'"',preview:dayLabel(m.startAt)+' '+fmtTime(m.startAt),ref:{view:'meetings'}});
  for(const [oid,o] of Object.entries(state.data.opportunities)) if(o.postedBy===me) for(const [uid,ts] of Object.entries(o.interestedAt||{})) if(uid!==me) out.push({type:'interest',fromId:uid,at:ts,text:'สนใจประกาศ "'+o.title+'" ของคุณ',ref:{view:'opps',opp:oid}});
  if(state.canEdit) for(const [uid,r] of Object.entries(state.data.requests)) if(uid!==me) out.push({type:'request',fromId:uid,at:r.requestedAt||0,text:'ขอสมัครสมาชิก Crew Room',preview:(r.employeeId||'')+' · '+(r.team||''),ref:{view:'members'}});
  const mm=state.data.members[me];
  if(mm&&mm.approvedBy&&mm.approvedBy!==me&&mm.status==='approved') out.push({type:'approved',fromId:mm.approvedBy,at:mm.approvedAt||0,text:'อนุมัติการสมัครสมาชิกของคุณแล้ว ยินดีต้อนรับ',ref:{view:'feed'}});
  return out.filter(n=>typeof n.at==='number'&&n.at>0).sort((a,b)=>b.at-a.at).slice(0,30);
}
function notifUnreadCount(){ const s=state.dm.prefs.notifSeenAt||0; return buildNotifs().filter(n=>n.at>s).length; }
function markNotifsSeen(){
  const now=Date.now(); if(!notifUnreadCount()) return;
  state.dm.prefs=Object.assign({},state.dm.prefs,{notifSeenAt:now});
  if(state.live&&state.me.id) privateSet('prefs',state.dm.prefs).catch(()=>{});
}
function goNotif(n){
  const r=n.ref||{};
  if(r.view==='chat'){ openChat(r.with); return; }
  if(r.view==='feed'){ ui.scrollToPost=r.post; go('feed'); }
  else if(r.view==='opps'){ ui.expandedOpp=r.opp; go('opps'); }
  else if(r.view==='profile'){ go('profile',state.me.id); }
  else go(r.view||'feed');
}
async function renderDMPanel(){
  const me=state.me.id;
  const convs=myConvs().sort((a,b)=>(b.lastAt||0)-(a.lastAt||0));
  const profIds=Object.keys(state.data.profiles).filter(id=>visibleMember(id));
  const ppl=await people([...convs.map(otherOf),...profIds]);
  const q=ui.dmSearch.trim().toLowerCase();
  const list=h('div',{class:'panel-list'});
  if(q){
    const hits=profIds.filter(id=>id!==me).map(id=>({id,p:state.data.profiles[id],name:(ppl[id]||{}).name||''})).filter(x=>(x.name+' '+(x.p.title||'')).toLowerCase().includes(q)).slice(0,10);
    if(!hits.length) list.append(h('div',{class:'empty-note',style:'padding:8px 14px'},'ไม่พบชื่อนี้ในไดเรกทอรี'));
    for(const x of hits){
      const ok=!state.live||!!(x.p.pubKey&&x.p.pubKey.x);
      list.append(h('button',{class:'conv',disabled:!ok,title:ok?'':'ยังไม่เคยเปิด Crew Room จึงยังรับข้อความไม่ได้',onclick:()=>openChat(x.id)},avatar(ppl[x.id]||{name:x.name},40),h('div',{class:'txt'},h('b',null,x.name),h('span',null,ok?(x.p.title||'เริ่มแชทใหม่'):'ยังไม่พร้อมรับข้อความ'))));
    }
  } else if(!convs.length){
    list.append(h('div',{class:'empty-note',style:'padding:8px 14px'},'ยังไม่มีข้อความ พิมพ์ชื่อเพื่อนร่วมทีมด้านบน หรือกด "ข้อความ" ในไดเรกทอรีเพื่อเริ่มแชท'));
  } else for(const c of convs){
    const o=otherOf(c); const p=ppl[o]||{name:'สมาชิก HR',color:'#6b7b86'};
    const last=(c.msgs||[]).slice(-1)[0]; const text=last?await plainText(last,o):'';
    const un=convUnread(c);
    list.append(h('button',{class:'conv'+(un?' unread':''),onclick:()=>openChat(o)},avatar(p,40),h('div',{class:'txt'},h('b',null,p.name),h('span',null,last?((last.f===me?'คุณ: ':'')+(text==null?'[ข้อความเข้ารหัส]':text)):'')),h('span',{class:'when'},last?ago(last.t):''),un?h('span',{class:'dot',title:un+' ข้อความใหม่'}):null));
  }
  const search=h('div',{class:'panel-search'},h('input',{id:'dm-search',type:'search',placeholder:'ค้นหาชื่อเพื่อเริ่มแชทใหม่',value:ui.dmSearch,'aria-label':'ค้นหาคนเพื่อส่งข้อความ',oninput:e=>{ui.dmSearch=e.target.value;render();}}));
  return h('div',{class:'panel',role:'dialog','aria-label':'ข้อความ'},h('div',{class:'panel-head'},h('h3',null,'ข้อความ'),h('span',{class:'small muted'},state.live?(state.dm.ready?'เข้ารหัสแบบ end-to-end':'กำลังเตรียมกุญแจ...'):'โหมดสาธิต')),search,list);
}
async function renderNotifPanel(){
  const list=buildNotifs(); const ppl=await people(list.map(n=>n.fromId));
  const mark=ui.notifMark||0;
  const body=h('div',{class:'panel-list'});
  if(!list.length) body.append(h('div',{class:'empty-note',style:'padding:8px 14px'},'ยังไม่มีการแจ้งเตือน เมื่อมีคนถูกใจหรือแสดงความคิดเห็นในโพสต์ของคุณ รับรองทักษะ หรือเชิญประชุม จะแสดงที่นี่'));
  for(const n of list){
    const p=ppl[n.fromId]||{name:'สมาชิก HR',color:'#6b7b86'};
    body.append(h('button',{class:'notif'+(n.at>mark?' unread':''),onclick:()=>{ ui.panel=null; goNotif(n); }},avatar(p,36),h('div',{class:'txt'},h('b',null,p.name),' ',n.text,n.preview?h('span',{class:'pv'},n.preview):null),h('span',{class:'when'},ago(n.at))));
  }
  return h('div',{class:'panel',role:'dialog','aria-label':'การแจ้งเตือน'},h('div',{class:'panel-head'},h('h3',null,'การแจ้งเตือน'),h('span',{class:'small muted'},'อัปเดตอัตโนมัติ')),body);
}
async function renderChatWin(){
  const me=state.me.id, other=ui.chatWith;
  const ppl=await people([other,me]); const p=ppl[other]||{name:'สมาชิก HR',color:'#6b7b86'};
  const id=convId(me,other); const c=state.data.dm[id]; const prof=profileOf(other);
  const canSend=state.live?!!(prof&&prof.pubKey&&prof.pubKey.x&&state.dm.ready):true;
  const body=h('div',{class:'body',id:'dm-body'});
  const msgs=(c&&c.msgs)||[];
  if(msgs.length){
    let lastDay='';
    for(const m of msgs){
      const day=new Date(m.t||0).toDateString();
      if(day!==lastDay){ body.append(h('div',{class:'bubble-time'},dayLabel(m.t||0)+' '+fmtTime(m.t||0))); lastDay=day; }
      if(m.sys==='call'){ body.append(h('div',{class:'bubble-sys'},callLogText(m)+' · '+fmtTime(m.t||0))); continue; }
      const text=await plainText(m,other);
      body.append(h('div',{class:'bubble-row'+(m.f===me?' me':'')},m.f!==me?avatar(p,24):null,h('div',{class:'bubble',title:fmtTime(m.t||0)},text==null?'[ถอดรหัสไม่ได้]':text)));
    }
  } else body.append(h('div',{class:'note'},canSend?'เริ่มบทสนทนากับ '+p.name+' ข้อความเข้ารหัสแบบ end-to-end อ่านได้เฉพาะคุณสองคน':'ผู้รับยังไม่เคยเปิด Crew Room จึงยังไม่มีกุญแจสำหรับรับข้อความ ชวนให้เปิดระบบครั้งแรกก่อน'));
  const inp=h('input',{id:'dm-input',placeholder:canSend?'พิมพ์ข้อความ แล้วกด Enter':'ยังส่งไม่ได้',disabled:(!canSend||!canAct())?true:null,value:ui.dmDraft,'aria-label':'ข้อความถึง '+p.name,oninput:e=>{ui.dmDraft=e.target.value;},onkeydown:e=>{ if(e.key==='Enter'){ e.preventDefault(); submitDM(); } }});
  setTimeout(()=>{ const el=document.getElementById('dm-body'); if(el) el.scrollTop=el.scrollHeight; },0);
  return h('div',{class:'chatwin',role:'dialog','aria-label':'แชทกับ '+p.name},
    h('div',{class:'head'},avatar(p,34),h('div',{class:'txt'},h('b',null,p.name),h('span',null,prof&&prof.title?prof.title:'')),
      h('button',{class:'btn ghost sm',title:'โทรด้วยเสียง','aria-label':'โทรด้วยเสียง',disabled:(!state.live||!canSend)?true:null,onclick:()=>startCall(other,'audio')},svg('phone',18)),
      h('button',{class:'btn ghost sm',title:'วิดีโอคอล','aria-label':'วิดีโอคอล',disabled:(!state.live||!canSend)?true:null,onclick:()=>startCall(other,'video')},svg('video',18)),
      h('button',{class:'btn ghost sm',title:'ดูโปรไฟล์',onclick:()=>go('profile',other)},'โปรไฟล์'),
      h('button',{class:'btn ghost sm','aria-label':'ปิดหน้าต่างแชท',onclick:()=>{ui.chatWith=null;render();}},'✕')),
    body,
    h('div',{class:'foot'},inp,h('button',{class:'btn primary sm',disabled:(!canSend||!canAct())?true:null,onclick:submitDM},'ส่ง')));
}

/* ---------- voice / video calls: 1:1 WebRTC, signaling over Supabase Realtime ---------- */
const RTC_CONFIG={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
const call={id:null,peerId:null,kind:'audio',role:null,status:'idle',ch:null,inviteCh:null,pc:null,local:null,remote:null,startedAt:null,timer:null,timeout:null,iceBuf:[],iceTimer:null,pendingIce:[],ring:null,muted:false,camOff:false,els:null};
let inboxCh=null;
function callSetup(){
  if(!sb||!state.me.id||inboxCh) return;
  inboxCh=sb.channel('calls-'+state.me.id)
    .on('broadcast',{event:'invite'},({payload})=>onCallInvite(payload||{}))
    .on('broadcast',{event:'cancel'},({payload})=>{ const p=payload||{}; if(call.status==='ringing'&&call.id===p.callId) endCall('missed'); })
    .subscribe();
}
function fmtDur(s){ s=Math.max(0,Math.round(s)); const m=Math.floor(s/60), r=s%60; return (m<10?'0':'')+m+':'+(r<10?'0':'')+r; }
function callLogText(m){
  const kind=m.kind==='video'?'วิดีโอคอล':'สายเสียง', ico=m.kind==='video'?'📹 ':'📞 ';
  if(m.status==='ended') return ico+kind+' '+fmtDur(m.dur||0);
  if(m.status==='declined') return ico+kind+' · ปฏิเสธสาย';
  if(m.status==='missed') return ico+kind+' · ไม่ได้รับสาย';
  return ico+kind+' · ไม่สำเร็จ';
}
async function getCallMedia(kind){
  const md=navigator.mediaDevices; if(!md||!md.getUserMedia) throw new Error('media unavailable');
  if(kind==='video'){ try{ return await md.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:true}); }catch(e){ console.warn('video unavailable, audio only',e); } }
  return await md.getUserMedia({audio:true});
}
function openCallChannel(id){
  const ch=sb.channel('call-'+id);
  ch.on('broadcast',{event:'accept'},()=>onCallAccepted())
    .on('broadcast',{event:'decline'},({payload})=>{ if(call.role==='caller') endCall((payload&&payload.reason)==='busy'?'busy':'declined'); })
    .on('broadcast',{event:'sdp'},({payload})=>onCallSdp(payload||{}))
    .on('broadcast',{event:'ice'},({payload})=>onCallIce(payload||{}))
    .on('broadcast',{event:'hangup'},()=>endCall(call.status==='active'?'ended':'missed'))
    .subscribe();
  return ch;
}
function callSend(event,payload){ if(!call.ch) return; call.ch.send({type:'broadcast',event,payload:payload||{}}).catch(()=>{}); }
async function startCall(otherId,kind){
  if(!state.live||!sb){ toast('การโทรใช้ได้เมื่อเชื่อมต่อระบบแล้ว'); return; }
  if(!canAct()||!otherId||otherId===state.me.id) return;
  if(call.status!=='idle'){ toast('มีสายที่กำลังใช้งานอยู่'); return; }
  if(!visibleMember(otherId)){ toast('โทรได้เฉพาะสมาชิกที่ได้รับอนุมัติแล้ว'); return; }
  let stream; try{ stream=await getCallMedia(kind); }catch(e){ toast('เปิดไมค์หรือกล้องไม่ได้ ตรวจสอบการอนุญาตของเบราว์เซอร์'); return; }
  Object.assign(call,{id:newId('c'),peerId:otherId,kind,role:'caller',status:'calling',local:stream,remote:null,startedAt:null,muted:false,camOff:stream.getVideoTracks().length===0,pendingIce:[],iceBuf:[],els:null});
  call.ch=openCallChannel(call.id);
  call.inviteCh=sb.channel('calls-'+otherId);
  call.inviteCh.subscribe(status=>{ if(status==='SUBSCRIBED') call.inviteCh.send({type:'broadcast',event:'invite',payload:{callId:call.id,from:state.me.id,kind}}).catch(()=>{}); });
  startRing('out');
  call.timeout=setTimeout(()=>{ if(call.status==='calling'){ if(call.inviteCh) call.inviteCh.send({type:'broadcast',event:'cancel',payload:{callId:call.id}}).catch(()=>{}); endCall('missed'); } },45000);
  ui.panel=null; render();
}
function onCallInvite(p){
  if(!p.callId||!p.from||p.from===state.me.id) return;
  if(call.status!=='idle'){
    const ch=sb.channel('call-'+p.callId);
    ch.subscribe(s=>{ if(s==='SUBSCRIBED'){ ch.send({type:'broadcast',event:'decline',payload:{reason:'busy'}}).catch(()=>{}); setTimeout(()=>{ try{ sb.removeChannel(ch); }catch(_){} },1500); } });
    return;
  }
  Object.assign(call,{id:p.callId,peerId:p.from,kind:p.kind==='video'?'video':'audio',role:'callee',status:'ringing',local:null,remote:null,startedAt:null,muted:false,camOff:false,pendingIce:[],iceBuf:[],els:null});
  call.ch=openCallChannel(call.id);
  startRing('in');
  call.timeout=setTimeout(()=>{ if(call.status==='ringing') endCall('missed'); },50000);
  render();
}
async function acceptCall(){
  if(call.status!=='ringing') return;
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
  let stream; try{ stream=await getCallMedia(call.kind); }catch(e){ toast('เปิดไมค์หรือกล้องไม่ได้ ตรวจสอบการอนุญาตของเบราว์เซอร์'); declineCall(); return; }
  if(call.status!=='ringing'){ for(const t of stream.getTracks()) t.stop(); return; }
  call.local=stream; call.camOff=stream.getVideoTracks().length===0; call.status='connecting';
  stopRing(); clearTimeout(call.timeout);
  ensurePC();
  callSend('accept',{});
  render();
}
function declineCall(){ if(call.status!=='ringing') return; callSend('decline',{reason:'declined'}); endCall('declined'); }
function onCallAccepted(){
  if(call.role!=='caller'||call.status!=='calling') return;
  call.status='connecting'; stopRing(); clearTimeout(call.timeout);
  if(call.inviteCh){ const c=call.inviteCh; call.inviteCh=null; setTimeout(()=>{ try{ sb.removeChannel(c); }catch(_){} },500); }
  const pc=ensurePC();
  pc.createOffer().then(o=>pc.setLocalDescription(o)).then(()=>callSend('sdp',{type:'offer',sdp:pc.localDescription.sdp})).catch(e=>{ console.error(e); endCall('failed'); });
  render();
}
function ensurePC(){
  if(call.pc) return call.pc;
  const pc=new RTCPeerConnection(RTC_CONFIG); call.pc=pc; call.remote=new MediaStream();
  if(call.local) for(const t of call.local.getTracks()) pc.addTrack(t,call.local);
  if(call.kind==='video'&&!(call.local&&call.local.getVideoTracks().length)){ try{ pc.addTransceiver('video',{direction:'recvonly'}); }catch(_){} }
  pc.ontrack=ev=>{ call.remote.addTrack(ev.track); ev.track.onended=()=>render(); attachCallMedia(); render(); };
  pc.onicecandidate=ev=>{ if(!ev.candidate) return; call.iceBuf.push(ev.candidate.toJSON()); if(!call.iceTimer) call.iceTimer=setTimeout(()=>{ call.iceTimer=null; const cands=call.iceBuf.splice(0); if(cands.length) callSend('ice',{cands}); },200); };
  pc.onconnectionstatechange=()=>{
    if(call.pc!==pc) return;
    if(pc.connectionState==='connected'&&call.status!=='active'){ call.status='active'; call.startedAt=Date.now(); clearInterval(call.timer); call.timer=setInterval(updateCallClock,1000); render(); }
    else if(pc.connectionState==='failed'){ callSend('hangup',{}); endCall(call.status==='active'?'ended':'failed'); }
    else if(pc.connectionState==='disconnected'){ setTimeout(()=>{ if(call.pc===pc&&pc.connectionState==='disconnected'){ callSend('hangup',{}); endCall('ended'); } },8000); }
  };
  return pc;
}
async function onCallSdp(p){
  if(call.status==='idle') return;
  try{
    const pc=ensurePC();
    if(p.type==='offer'){
      if(call.role!=='callee') return;
      await pc.setRemoteDescription({type:'offer',sdp:p.sdp});
      for(const c of call.pendingIce.splice(0)) pc.addIceCandidate(c).catch(()=>{});
      const ans=await pc.createAnswer(); await pc.setLocalDescription(ans);
      callSend('sdp',{type:'answer',sdp:pc.localDescription.sdp});
    } else if(p.type==='answer'&&pc.signalingState==='have-local-offer'){
      await pc.setRemoteDescription({type:'answer',sdp:p.sdp});
      for(const c of call.pendingIce.splice(0)) pc.addIceCandidate(c).catch(()=>{});
    }
  }catch(e){ console.error('call sdp',e); callSend('hangup',{}); endCall('failed'); }
}
function onCallIce(p){
  const cands=Array.isArray(p.cands)?p.cands:[]; if(!cands.length||call.status==='idle') return;
  const pc=call.pc; if(!pc||!pc.remoteDescription){ call.pendingIce.push(...cands); return; }
  for(const c of cands) pc.addIceCandidate(c).catch(()=>{});
}
function hangupCall(){
  if(call.status==='idle') return;
  if(call.status==='calling'&&call.inviteCh) call.inviteCh.send({type:'broadcast',event:'cancel',payload:{callId:call.id}}).catch(()=>{});
  callSend('hangup',{});
  endCall(call.status==='active'?'ended':'missed');
}
function endCall(reason){
  if(call.status==='idle') return;
  const wasCaller=call.role==='caller', peer=call.peerId, kind=call.kind, dur=call.startedAt?(Date.now()-call.startedAt)/1000:0;
  stopRing(); clearTimeout(call.timeout); clearInterval(call.timer); clearTimeout(call.iceTimer);
  if(call.pc){ try{ call.pc.close(); }catch(_){} }
  if(call.local) for(const t of call.local.getTracks()) t.stop();
  const chs=[call.ch,call.inviteCh].filter(Boolean);
  setTimeout(()=>{ for(const c of chs){ try{ sb.removeChannel(c); }catch(_){} } },800);
  Object.assign(call,{id:null,peerId:null,role:null,status:'idle',ch:null,inviteCh:null,pc:null,local:null,remote:null,startedAt:null,timer:null,timeout:null,iceBuf:[],iceTimer:null,pendingIce:[],els:null,muted:false,camOff:false});
  const label={ended:dur?'วางสายแล้ว ('+fmtDur(dur)+')':'วางสายแล้ว',declined:'อีกฝ่ายปฏิเสธสาย',missed:wasCaller?'ไม่มีผู้รับสาย':'สายที่ไม่ได้รับ',busy:'อีกฝ่ายกำลังใช้สายอยู่',failed:'เชื่อมต่อสายไม่สำเร็จ'}[reason]||'สิ้นสุดการโทร';
  toast(label);
  if(wasCaller) logCall(peer,kind,reason,dur).catch(e=>console.warn('call log',e));
  render();
}
async function logCall(peer,kind,status,dur){
  if(!state.live||!peer) return;
  const me=state.me.id, id=convId(me,peer), cur=state.data.dm[id];
  const msg={f:me,t:Date.now(),sys:'call',kind,status:(status==='busy'||status==='failed')?'missed':status,dur:Math.round(dur)};
  const msgs=cur?clone(cur.msgs||[]):[]; msgs.push(msg); while(msgs.length>300) msgs.shift();
  const now=Date.now();
  if(cur) await updateDoc('dm',id,{msgs,lastAt:now,lastFrom:me,seen:{[me]:now}});
  else await setDoc('dm',id,{parts:[me,peer],msgs,lastAt:now,lastFrom:me,seen:{[me]:now},createdAt:now});
}
function startRing(mode){
  stopRing();
  if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(_){ return; } }
  const ctx=audioCtx; if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  const play=()=>{
    try{
      const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.value=mode==='in'?740:440;
      o.connect(g); g.connect(ctx.destination); const t=ctx.currentTime; g.gain.setValueAtTime(0.0001,t);
      if(mode==='in'){ g.gain.exponentialRampToValueAtTime(0.12,t+0.05); g.gain.setValueAtTime(0.12,t+0.35); g.gain.exponentialRampToValueAtTime(0.0001,t+0.42); g.gain.setValueAtTime(0.0001,t+0.55); g.gain.exponentialRampToValueAtTime(0.12,t+0.6); g.gain.setValueAtTime(0.12,t+0.9); g.gain.exponentialRampToValueAtTime(0.0001,t+0.97); o.start(t); o.stop(t+1); }
      else { g.gain.exponentialRampToValueAtTime(0.1,t+0.05); g.gain.setValueAtTime(0.1,t+1.0); g.gain.exponentialRampToValueAtTime(0.0001,t+1.1); o.start(t); o.stop(t+1.2); }
    }catch(_){}
  };
  play(); call.ring=setInterval(play,mode==='in'?2000:3500);
}
function stopRing(){ if(call.ring){ clearInterval(call.ring); call.ring=null; } }
function callEls(){
  if(!call.els){
    const remote=h('video',{autoplay:true,playsinline:true,class:'call-remote'});
    const local=h('video',{autoplay:true,playsinline:true,muted:true,class:'call-local'}); local.muted=true;
    call.els={remote,local};
  }
  return call.els;
}
function attachCallMedia(){
  const els=callEls();
  if(call.remote&&els.remote.srcObject!==call.remote) els.remote.srcObject=call.remote;
  if(call.local&&els.local.srcObject!==call.local) els.local.srcObject=call.local;
}
function updateCallClock(){ const el=document.getElementById('call-clock'); if(el&&call.startedAt) el.textContent=fmtDur((Date.now()-call.startedAt)/1000); }
function toggleCallMic(){ if(!call.local) return; call.muted=!call.muted; for(const t of call.local.getAudioTracks()) t.enabled=!call.muted; render(); }
function toggleCallCam(){ if(!call.local) return; const vs=call.local.getVideoTracks(); if(!vs.length){ toast('สายนี้ไม่มีภาพจากกล้อง'); return; } call.camOff=!call.camOff; for(const t of vs) t.enabled=!call.camOff; render(); }
function callBtn(cls,icon,label,onclick){ return h('button',{class:'call-btn'+(cls?' '+cls:''),onclick},h('span',{class:'ico'},svg(icon,26)),h('span',{class:'lbl'},label)); }
async function renderCallOverlay(){
  const ppl=await people([call.peerId]); const p=ppl[call.peerId]||{name:'สมาชิก HR',color:'#6b7b86'};
  const els=callEls(); attachCallMedia();
  const kindLabel=call.kind==='video'?'วิดีโอคอล':'สายเสียง';
  const statusText={calling:kindLabel+' · กำลังเรียก...',ringing:kindLabel+'เรียกเข้า',connecting:'กำลังเชื่อมต่อ...',active:kindLabel}[call.status]||'';
  const remoteHasVideo=!!(call.remote&&call.remote.getVideoTracks().some(t=>t.readyState==='live'));
  const showVideo=call.kind==='video'&&(call.status==='active'||call.status==='connecting');
  const stage=h('div',{class:'call-stage'+(showVideo&&remoteHasVideo?' has-video':'')},
    els.remote,
    showVideo&&call.local&&!call.camOff?els.local:null,
    h('div',{class:'call-id'},avatar(p,88),h('h2',null,p.name),h('div',{class:'call-status'},statusText,call.status==='active'?h('span',{id:'call-clock',class:'call-clock'},fmtDur(call.startedAt?(Date.now()-call.startedAt)/1000:0)):null)));
  const controls=h('div',{class:'call-controls'});
  if(call.status==='ringing'){
    controls.append(callBtn('decline','phone','ปฏิเสธ',declineCall),callBtn('accept',call.kind==='video'?'video':'phone','รับสาย',acceptCall));
  } else {
    controls.append(callBtn(call.muted?'off':'',call.muted?'micoff':'mic',call.muted?'เปิดไมค์':'ปิดไมค์',toggleCallMic));
    if(call.kind==='video') controls.append(callBtn(call.camOff?'off':'',call.camOff?'camoff':'video',call.camOff?'เปิดกล้อง':'ปิดกล้อง',toggleCallCam));
    controls.append(callBtn('decline','phone','วางสาย',hangupCall));
  }
  return h('div',{class:'call-overlay',role:'dialog','aria-modal':'true','aria-label':'การโทร'},h('div',{class:'call-card'},stage,controls));
}

/* ---------- membership: register / approve ---------- */
function memberOf(id){ return state.data.members[id]||null; }
function isApproved(id){ const m=memberOf(id); return !!(m&&m.status==='approved'); }
function myApproved(){ return !state.live||state.canEdit||isApproved(state.me.id); }
function visibleMember(id){ if(!state.live) return true; if(id===state.me.id) return true; return isApproved(id); }
function gateState(){
  if(!state.live||state.status!=='ready') return null;
  if(state.auth.recovery) return 'recovery';
  if(!state.auth.signedIn) return ui.authMode==='signup'?'signup':'login';
  if(!state.dataLoaded) return 'loading';
  if(!myApproved()) return 'pending';
  return null;
}
function lockScreen(){
  if(!state.live){ toast('โหมดสาธิตไม่มีระบบเข้าสู่ระบบ'); return; }
  if(state.view==='room') roomLeave();
  sb.auth.signOut().catch(()=>{}).then(()=>location.reload());
}
let lastActive=Date.now();
function noteActive(){ lastActive=Date.now(); }
function renderGateTopbar(){
  return h('header',{class:'topbar'},h('div',{class:'topbar-in'},
    h('span',{class:'brand'},svg('plane',26),h('span',null,'Crew Room',h('small',null,'ฝ่ายทรัพยากรบุคคล · ภายในเท่านั้น'))),
    h('div',{class:'top-actions',style:'margin-left:auto'},state.auth.signedIn?[h('span',{class:'me-chip',style:'cursor:default'},avatar(state.me,30),h('span',{class:'nm'},state.me.name||'ฉัน')),h('button',{class:'btn sm',onclick:lockScreen},'ออกจากระบบ')]:null)));
}
async function renderGate(g){
  if(g==='loading') return h('main',{class:'main'},h('div',{class:'stack'},h('div',{class:'skeleton'}),h('div',{class:'skeleton'})));
  if(g==='login') return renderLogin();
  if(g==='signup') return renderSignup();
  if(g==='recovery') return renderNewPassword();
  return renderPending();
}
function authShell(...kids){ return h('main',{class:'auth-wrap'},h('div',{class:'card lift pad auth-card'},...kids)); }
function whoBlock(sub){ return h('div',{class:'auth-who'},avatar(state.me,56),h('div',null,h('b',null,state.me.name||'สมาชิก HR'),h('span',{class:'small muted'},sub||'เข้าสู่ระบบแล้ว'))); }
function brandBlock(){ return h('div',{class:'brand',style:'margin-bottom:16px'},svg('plane',26),h('span',null,'Crew Room',h('small',null,'ฝ่ายทรัพยากรบุคคล · ภายในเท่านั้น'))); }
function authError(msg){ if(!msg) return ''; if(/invalid login|invalid credentials/i.test(msg)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'; if(/not confirmed/i.test(msg)) return 'ยังไม่ได้ยืนยันอีเมล เปิดลิงก์ในอีเมลก่อนแล้วลองใหม่'; if(/already registered|already exists/i.test(msg)) return 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน'; if(/password/i.test(msg)&&/6|8|short|weak/i.test(msg)) return 'รหัสผ่านสั้นหรือง่ายเกินไป ใช้อย่างน้อย 8 ตัวอักษร'; if(/rate limit|too many/i.test(msg)) return 'ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่'; return msg; }
function renderLogin(){
  const f=ui.authForm;
  const email=h('input',{id:'li-email',type:'email',autocomplete:'username',value:f.email,placeholder:'name@pattayaaviation.com',oninput:e=>{f.email=e.target.value;}});
  const pass=h('input',{id:'li-pass',type:'password',autocomplete:'current-password',value:f.password,placeholder:'รหัสผ่าน',oninput:e=>{f.password=e.target.value;},onkeydown:e=>{ if(e.key==='Enter'){ e.preventDefault(); doSignIn(); } }});
  return authShell(brandBlock(),
    h('h2',null,'เข้าสู่ระบบ'),h('p',{class:'lead'},'ใช้อีเมลและรหัสผ่านที่สมัครไว้กับ Crew Room'),
    h('div',{class:'form'},field('อีเมล',email),field('รหัสผ่าน',pass)),
    ui.authErr?h('div',{class:'auth-err',role:'alert'},ui.authErr):null,
    h('div',{class:'form-actions',style:'margin-top:14px;justify-content:space-between'},
      h('button',{class:'btn ghost sm',onclick:()=>{ ui.authMode='signup'; ui.authErr=''; render(); }},'ยังไม่มีบัญชี? สมัครสมาชิก'),
      h('button',{class:'btn primary',disabled:state.auth.busy,onclick:doSignIn},state.auth.busy?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ')),
    h('div',{class:'auth-foot'},'ลืมรหัสผ่าน? กรอกอีเมลด้านบนแล้ว ',h('button',{class:'btn ghost sm',style:'padding:0 2px;color:var(--accent)',onclick:doResetPassword},'กดที่นี่เพื่อรับลิงก์ตั้งรหัสผ่านใหม่')));
}
async function doSignIn(){
  if(state.auth.busy) return; const f=ui.authForm;
  if(!f.email.trim()||!f.password){ ui.authErr='กรอกอีเมลและรหัสผ่าน'; render(); return; }
  state.auth.busy=true; ui.authErr=''; render();
  const {error}=await sb.auth.signInWithPassword({email:f.email.trim(),password:f.password});
  state.auth.busy=false;
  if(error){ ui.authErr=authError(error.message); render(); }
}
async function doResetPassword(){
  const email=ui.authForm.email.trim();
  if(!email){ ui.authErr='กรอกอีเมลก่อน แล้วกดลิงก์ตั้งรหัสผ่านใหม่'; render(); return; }
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0].split('?')[0]});
  toast(error?authError(error.message):'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว');
}
function renderSignup(){
  const f=ui.authForm;
  const name=h('input',{id:'su-name',value:f.name,autocomplete:'name',placeholder:'ชื่อ-นามสกุล',maxlength:'80',oninput:e=>{f.name=e.target.value;}});
  const email=h('input',{id:'su-email',type:'email',autocomplete:'username',value:f.email,placeholder:'name@pattayaaviation.com',oninput:e=>{f.email=e.target.value;}});
  const pass=h('input',{id:'su-pass',type:'password',autocomplete:'new-password',value:f.password,placeholder:'อย่างน้อย 8 ตัวอักษร',oninput:e=>{f.password=e.target.value;}});
  const pass2=h('input',{id:'su-pass2',type:'password',autocomplete:'new-password',value:f.password2,placeholder:'พิมพ์รหัสผ่านอีกครั้ง',oninput:e=>{f.password2=e.target.value;},onkeydown:e=>{ if(e.key==='Enter'){ e.preventDefault(); doSignUp(); } }});
  return authShell(brandBlock(),
    h('h2',null,'สมัครสมาชิก'),h('p',{class:'lead'},'สร้างบัญชีด้วยอีเมลที่ทำงาน หลังสมัครจะมีขั้นตอนกรอกข้อมูลพนักงานให้ผู้ดูแลอนุมัติ'),
    h('div',{class:'form'},field('ชื่อที่แสดง',name),field('อีเมล',email),h('div',{class:'form-row'},field('รหัสผ่าน',pass),field('ยืนยันรหัสผ่าน',pass2))),
    ui.authErr?h('div',{class:'auth-err',role:'alert'},ui.authErr):null,
    h('div',{class:'form-actions',style:'margin-top:14px;justify-content:space-between'},
      h('button',{class:'btn ghost sm',onclick:()=>{ ui.authMode='login'; ui.authErr=''; render(); }},'มีบัญชีแล้ว? เข้าสู่ระบบ'),
      h('button',{class:'btn primary',disabled:state.auth.busy,onclick:doSignUp},state.auth.busy?'กำลังสร้างบัญชี...':'สร้างบัญชี')));
}
async function doSignUp(){
  if(state.auth.busy) return; const f=ui.authForm;
  const name=f.name.trim(), email=f.email.trim();
  if(name.length<2){ ui.authErr='กรอกชื่อที่แสดง'; render(); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ ui.authErr='รูปแบบอีเมลไม่ถูกต้อง'; render(); return; }
  if((f.password||'').length<8){ ui.authErr='รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'; render(); return; }
  if(f.password!==f.password2){ ui.authErr='รหัสผ่านทั้งสองช่องไม่ตรงกัน'; render(); return; }
  state.auth.busy=true; ui.authErr=''; render();
  const {data,error}=await sb.auth.signUp({email,password:f.password,options:{data:{name},emailRedirectTo:location.href.split('#')[0].split('?')[0]}});
  state.auth.busy=false;
  if(error){ ui.authErr=authError(error.message); render(); return; }
  if(!data.session){ ui.authMode='login'; ui.authForm.password=''; ui.authForm.password2=''; toast('สร้างบัญชีแล้ว เปิดลิงก์ยืนยันในอีเมล แล้วกลับมาเข้าสู่ระบบ'); render(); }
}
function renderNewPassword(){
  const f=ui.authForm;
  const pass=h('input',{id:'np-pass',type:'password',autocomplete:'new-password',value:f.password,placeholder:'รหัสผ่านใหม่ อย่างน้อย 8 ตัวอักษร',oninput:e=>{f.password=e.target.value;}});
  const pass2=h('input',{id:'np-pass2',type:'password',autocomplete:'new-password',value:f.password2,placeholder:'พิมพ์อีกครั้ง',oninput:e=>{f.password2=e.target.value;}});
  const save=h('button',{class:'btn primary',disabled:state.auth.busy,onclick:async()=>{
    if((f.password||'').length<8){ ui.authErr='รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'; render(); return; }
    if(f.password!==f.password2){ ui.authErr='รหัสผ่านทั้งสองช่องไม่ตรงกัน'; render(); return; }
    state.auth.busy=true; ui.authErr=''; render();
    const {error}=await sb.auth.updateUser({password:f.password});
    state.auth.busy=false;
    if(error){ ui.authErr=authError(error.message); render(); return; }
    state.auth.recovery=false; ui.authForm.password=''; ui.authForm.password2=''; toast('ตั้งรหัสผ่านใหม่แล้ว'); render();
  }},'บันทึกรหัสผ่านใหม่');
  return authShell(brandBlock(),h('h2',null,'ตั้งรหัสผ่านใหม่'),h('p',{class:'lead'},'กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ'),
    h('div',{class:'form'},field('รหัสผ่านใหม่',pass),field('ยืนยันรหัสผ่านใหม่',pass2)),
    ui.authErr?h('div',{class:'auth-err',role:'alert'},ui.authErr):null,
    h('div',{class:'form-actions',style:'margin-top:14px'},save));
}
function regModel(){
  const p=myProfile()||{}; const r=state.data.requests[state.me.id]||{}; const m=memberOf(state.me.id)||{};
  return {employeeId:r.employeeId||m.employeeId||'',team:r.team||p.team||'',title:r.title||p.title||'',note:r.note||'',consent:false,pin:'',pin2:''};
}
function renderRegister(withPin){
  const f=ui.regForm||(ui.regForm=regModel());
  const admin=state.canEdit;
  const eid=h('input',{id:'reg-eid',value:f.employeeId,placeholder:'เช่น PA-01234',autocomplete:'off',maxlength:'24',oninput:e=>{f.employeeId=e.target.value;}});
  const team=h('select',{id:'reg-team',onchange:e=>{f.team=e.target.value;}},h('option',{value:'',selected:!f.team},'เลือกทีม'),TEAMS.map(t=>h('option',{value:t,selected:f.team===t},t)));
  const title=h('input',{id:'reg-title',value:f.title,placeholder:'เช่น เจ้าหน้าที่สรรหาอาวุโส',oninput:e=>{f.title=e.target.value;}});
  const note=h('textarea',{id:'reg-note',placeholder:'เช่น ย้ายมาจากฝ่ายปฏิบัติการภาคพื้น เริ่มงาน 1 ต.ค. (ไม่บังคับ)',style:'min-height:60px',oninput:e=>{f.note=e.target.value;}},f.note);
  const consent=h('label',{class:'check',style:'align-items:flex-start'},h('input',{type:'checkbox',id:'reg-consent',checked:f.consent,onchange:e=>{f.consent=e.target.checked;}}),h('span',null,'ยินยอมให้ฝ่ายทรัพยากรบุคคลเก็บและแสดงรหัสพนักงาน ตำแหน่ง ทีม และข้อมูลโปรไฟล์ที่ฉันกรอก แก่สมาชิก Crew Room เพื่อการประสานงานภายในแผนก ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล'));
  const mkPin=(id,label,key)=>h('div',{class:'field'},h('label',{for:id},label),h('input',{id,type:'password',inputmode:'numeric',autocomplete:'new-password',maxlength:'6',class:'pin-input',placeholder:'••••••',value:f[key]||'',oninput:e=>{ f[key]=e.target.value.replace(/\D/g,'').slice(0,6); e.target.value=f[key]; }}));
  const submit=h('button',{class:'btn primary',onclick:()=>submitRegister(withPin,submit)},admin?'บันทึกและเข้าใช้งาน':'ส่งคำขอสมัครสมาชิก');
  return authShell(
    whoBlock(admin?'ผู้ดูแลระบบ ไม่ต้องรออนุมัติ':'ยืนยันตัวตนผ่านบัญชีองค์กรแล้ว'),
    h('h2',null,admin?'ตั้งค่าบัญชีผู้ดูแล':'สมัครสมาชิก Crew Room'),
    h('p',{class:'lead'},admin?'กรอกข้อมูลพนักงานของคุณและตั้ง PIN สำหรับเข้าสู่ระบบ':'กรอกข้อมูลพนักงาน ผู้ดูแลจะตรวจสอบและอนุมัติก่อนเข้าใช้งาน'),
    h('div',{class:'form'},
      field('รหัสพนักงาน',eid),
      h('div',{class:'form-row'},field('ทีม',team),field('ตำแหน่ง',title)),
      admin?null:field('หมายเหตุถึงผู้ดูแล',note),
      withPin?h('div',null,h('div',{class:'eyebrow',style:'margin-bottom:8px'},'ตั้ง PIN สำหรับเข้าสู่ระบบ (ตัวเลข 6 หลัก)'),h('div',{class:'form-row'},mkPin('reg-pin','PIN','pin'),mkPin('reg-pin2','ยืนยัน PIN','pin2'))):null,
      consent),
    ui.authErr?h('div',{class:'auth-err',role:'alert'},ui.authErr):null,
    h('div',{class:'form-actions',style:'margin-top:14px'},submit),
    h('div',{class:'auth-foot'},'ชื่อและรูปโปรไฟล์มาจากบัญชีองค์กร ข้อมูลที่กรอกจะแสดงในไดเรกทอรีของแผนกเมื่อได้รับอนุมัติ'));
}
async function submitRegister(withPin,btn){
  const f=ui.regForm; if(!f) return;
  const eidV=f.employeeId.trim();
  if(!eidV||eidV.length>24){ ui.authErr='ใส่รหัสพนักงาน'; render(); return; }
  if(!f.team){ ui.authErr='เลือกทีม'; render(); return; }
  if(!f.title.trim()){ ui.authErr='ใส่ตำแหน่ง'; render(); return; }
  if(withPin){ if(!/^\d{6}$/.test(f.pin||'')){ ui.authErr='PIN ต้องเป็นตัวเลข 6 หลัก'; render(); return; } if(f.pin!==f.pin2){ ui.authErr='PIN ทั้งสองช่องไม่ตรงกัน'; render(); return; } }
  if(!f.consent){ ui.authErr='กรุณาติ๊กยินยอมการเก็บข้อมูล'; render(); return; }
  if(btn) btn.disabled=true; ui.authErr='';
  const me=state.me.id, now=Date.now();
  try{
    const prof=myProfile(); const base=prof?clone(prof):{bio:'',skills:[],experience:[],certs:[],following:[],location:''};
    base.title=f.title.trim(); base.team=f.team; base.updatedAt=now; if(state.dm.pub&&!base.pubKey) base.pubKey=state.dm.pub;
    await setDoc('profiles',me,base);
    if(state.canEdit) await setDoc('members',me,{status:'approved',role:'admin',employeeId:eidV,team:f.team,title:base.title,requestedAt:now,approvedAt:now,approvedBy:me});
    else await setDoc('requests',me,{employeeId:eidV,team:f.team,title:base.title,note:(f.note||'').trim().slice(0,300),requestedAt:now});
    noteActive(); ui.regForm=null;
    toast(state.canEdit?'บันทึกแล้ว ยินดีต้อนรับ':'ส่งคำขอแล้ว รอผู้ดูแลอนุมัติ');
  }catch(e){ console.error(e); ui.authErr=msgFor(e); if(btn) btn.disabled=false; }
  render();
}
function renderPending(){
  const me=state.me.id; const r=state.data.requests[me]; const m=memberOf(me);
  if(!r&&!(m&&(m.status==='rejected'||m.status==='revoked'))) return renderRegister(false);
  if(r){
    return authShell(whoBlock(),
      h('div',{style:'margin-bottom:10px'},h('span',{class:'status-pill pending'},'รอผู้ดูแลอนุมัติ')),
      h('h2',null,'ส่งคำขอสมัครสมาชิกแล้ว'),
      h('p',{class:'lead'},'ผู้ดูแล Crew Room จะเห็นคำขอของคุณทันทีในระบบ เมื่ออนุมัติแล้วหน้านี้จะเปิดให้ใช้งานเองโดยไม่ต้องโหลดใหม่'),
      h('div',{class:'card pad',style:'background:var(--surface-2);border:0'},
        h('div',{class:'small'},h('span',{class:'eyebrow'},'รหัสพนักงาน'),' ',h('b',{style:'font-family:var(--mono)'},r.employeeId||'')),
        h('div',{class:'small',style:'margin-top:4px'},h('span',{class:'eyebrow'},'ทีม'),' ',r.team||''),
        h('div',{class:'small',style:'margin-top:4px'},h('span',{class:'eyebrow'},'ตำแหน่ง'),' ',r.title||''),
        h('div',{class:'small muted',style:'margin-top:4px'},'ส่งเมื่อ '+ago(r.requestedAt||0))),
      h('div',{class:'form-actions',style:'margin-top:14px;justify-content:space-between'},
        h('button',{class:'btn ghost sm',onclick:()=>{ ui.regForm=regModel(); ui.regForm.consent=true; ui.regForm.edit=true; render(); }},'แก้ไขคำขอ'),
        h('button',{class:'btn sm',onclick:lockScreen},'ออกจากระบบ')),
      ui.regForm&&ui.regForm.edit?h('div',{style:'margin-top:14px'},renderRegisterInline()):null);
  }
  const rejected=m.status==='rejected';
  return authShell(whoBlock(),
    h('div',{style:'margin-bottom:10px'},h('span',{class:'status-pill '+m.status},rejected?'คำขอไม่ได้รับอนุมัติ':'สิทธิ์การใช้งานถูกยกเลิก')),
    h('h2',null,rejected?'ผู้ดูแลไม่อนุมัติคำขอนี้':'บัญชีนี้ถูกยกเลิกสิทธิ์'),
    m.reason?h('p',{class:'lead'},'เหตุผล: '+m.reason):h('p',{class:'lead'},'ติดต่อผู้ดูแล Crew Room ของแผนกหากคิดว่าเป็นความผิดพลาด'),
    rejected?h('div',{class:'form-actions',style:'margin-top:8px;justify-content:flex-start'},h('button',{class:'btn primary sm',onclick:()=>{ ui.regForm=regModel(); ui.regForm.edit=true; render(); }},'ส่งคำขอใหม่')):null,
    ui.regForm&&ui.regForm.edit?h('div',{style:'margin-top:14px'},renderRegisterInline()):null,
    h('div',{class:'form-actions',style:'margin-top:14px'},h('button',{class:'btn sm',onclick:lockScreen},'ออกจากระบบ')));
}
function renderRegisterInline(){ const el=renderRegister(false); const card=el.querySelector('.auth-card'); card.classList.remove('lift'); card.style.padding='0'; card.style.border='0'; card.style.background='transparent'; const who=card.querySelector('.auth-who'); if(who) who.remove(); return card; }
async function renderMembers(){
  if(!state.canEdit) return h('div',{class:'card pad empty-note'},'หน้านี้สำหรับผู้ดูแลระบบ');
  const reqs=Object.entries(state.data.requests).map(([id,r])=>Object.assign({id},r)).sort((a,b)=>(a.requestedAt||0)-(b.requestedAt||0));
  const mems=Object.entries(state.data.members).map(([id,m])=>Object.assign({id},m));
  const ppl=await people([...reqs.map(r=>r.id),...mems.map(m=>m.id),...mems.map(m=>m.approvedBy)]);
  const nm=id=>(ppl[id]||{name:'สมาชิก HR',color:'#6b7b86'});
  const reqRows=reqs.map(r=>{
    const noteInp=h('input',{id:'rj-'+r.id,placeholder:'เหตุผล (ถ้าปฏิเสธ)',value:ui.rejectNote[r.id]||'',style:'border:1px solid var(--line);border-radius:8px;padding:5px 9px;background:var(--bg);font-size:13px;min-width:160px',oninput:e=>{ui.rejectNote[r.id]=e.target.value;}});
    return h('div',{class:'member-row'},avatar(nm(r.id),40),
      h('div',{class:'txt'},h('b',null,nm(r.id).name),h('span',null,h('span',{class:'eid'},r.employeeId||'-'),' · ',r.team||'',' · ',r.title||''),r.note?h('span',null,'หมายเหตุ: '+r.note):null,h('span',null,'ส่งเมื่อ '+ago(r.requestedAt||0))),
      h('div',{class:'acts'},noteInp,
        h('button',{class:'btn sm danger',onclick:()=>decideRequest(r,false)},'ปฏิเสธ'),
        h('button',{class:'btn sm primary',onclick:()=>decideRequest(r,true)},'อนุมัติ')));
  });
  const approved=mems.filter(m=>m.status==='approved').sort((a,b)=>(b.approvedAt||0)-(a.approvedAt||0));
  const others=mems.filter(m=>m.status!=='approved');
  const memRow=m=>h('div',{class:'member-row'},avatar(nm(m.id),40),
    h('div',{class:'txt'},h('b',null,nm(m.id).name,m.id===state.me.id?' (คุณ)':'',state.data.profiles[m.id]&&state.data.profiles[m.id].sample?' · ตัวอย่าง':''),h('span',null,h('span',{class:'eid'},m.employeeId||'-'),' · ',m.team||'',' · ',m.title||''),h('span',null,(m.status==='approved'?'อนุมัติเมื่อ '+fmtDate(m.approvedAt||0)+(m.approvedBy?' โดย '+nm(m.approvedBy).name:''):m.status==='rejected'?'ปฏิเสธเมื่อ '+fmtDate(m.decidedAt||0):'ยกเลิกสิทธิ์เมื่อ '+fmtDate(m.decidedAt||0))+(m.reason?' · '+m.reason:''))),
    h('div',{class:'acts'},m.id===state.me.id?null:(m.status==='approved'
      ?h('button',{class:'btn sm danger',onclick:async()=>{ if(confirm('ยกเลิกสิทธิ์การใช้งานของ '+nm(m.id).name+'?')) await guarded(()=>updateDoc('members',m.id,{status:'revoked',decidedAt:Date.now(),decidedBy:state.me.id})); }},'ยกเลิกสิทธิ์')
      :h('button',{class:'btn sm',onclick:async()=>{ await guarded(()=>updateDoc('members',m.id,{status:'approved',approvedAt:Date.now(),approvedBy:state.me.id,reason:null})); }},'คืนสิทธิ์'))));
  return h('div',null,
    h('div',{style:'margin-bottom:14px'},h('h2',null,'สมาชิกและคำขอสมัคร'),h('div',{class:'small muted'},'ผู้ที่ได้รับอนุมัติจะเห็นฟีด ไดเรกทอรี และใช้งานทุกส่วนได้ ส่วนสิทธิ์เปิดลิงก์ระบบยังกำหนดจากการแชร์ของแพลตฟอร์มที่โฮสต์')),
    h('div',{class:'card pad section'},h('h3',null,'คำขอรออนุมัติ',h('span',{class:'eyebrow'},reqs.length+' รายการ')),reqRows.length?h('div',null,reqRows):h('div',{class:'empty-note'},'ไม่มีคำขอค้าง')),
    h('div',{class:'card pad section'},h('h3',null,'สมาชิกที่ใช้งานได้',h('span',{class:'eyebrow'},approved.length+' คน')),approved.length?h('div',null,approved.map(memRow)):h('div',{class:'empty-note'},'ยังไม่มีสมาชิก')),
    others.length?h('div',{class:'card pad section'},h('h3',null,'ถูกปฏิเสธ / ยกเลิกสิทธิ์',h('span',{class:'eyebrow'},others.length+' คน')),h('div',null,others.map(memRow))):null);
}
async function decideRequest(r,approve){
  const now=Date.now(); const reason=(ui.rejectNote[r.id]||'').trim().slice(0,200);
  if(!approve&&!confirm('ปฏิเสธคำขอของ'+(r.employeeId?' '+r.employeeId:'')+'?')) return;
  const body=approve?{status:'approved',role:'member',employeeId:r.employeeId||'',team:r.team||'',title:r.title||'',requestedAt:r.requestedAt||now,approvedAt:now,approvedBy:state.me.id}
    :{status:'rejected',employeeId:r.employeeId||'',team:r.team||'',title:r.title||'',requestedAt:r.requestedAt||now,decidedAt:now,decidedBy:state.me.id,reason};
  const ok=await guarded(()=>setDoc('members',r.id,body));
  if(ok){ await guarded(()=>delDoc('requests',r.id)); delete ui.rejectNote[r.id]; toast(approve?'อนุมัติแล้ว':'ปฏิเสธแล้ว'); }
}

/* ---------- calendar ---------- */
const EVENT_TYPES={activity:'กิจกรรม',training:'อบรม',holiday:'วันหยุด',deadline:'กำหนดส่ง',other:'อื่นๆ'};
const TH_MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_DOW=['อา','จ','อ','พ','พฤ','ศ','ส'];
function dayKey(ts){ const d=new Date(ts); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function keyToDate(k){ const p=String(k).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
function startOfDay(ts){ const d=new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function isoDate(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function itemEnd(x){ return x.allDay?startOfDay(x.endAt||x.startAt)+DAY-1:(x.endAt||x.startAt); }
function calendarItems(){
  const out=[];
  for(const m of meetingsList()){
    if(!(m.open||isInvited(m)||state.canEdit)) continue;
    out.push({id:'m:'+m.id,kind:'meeting',type:'meeting',title:m.title,startAt:m.startAt,endAt:meetEnd(m),allDay:false,location:'ห้องประชุมออนไลน์',ref:m.id,done:m.status==='ended'});
  }
  for(const [id,o] of Object.entries(state.data.opportunities)){
    if(o.status==='closed'||typeof o.deadline!=='number') continue;
    out.push({id:'o:'+id,kind:'opp',type:'deadline',title:'ปิดรับ: '+o.title,startAt:startOfDay(o.deadline),endAt:startOfDay(o.deadline),allDay:true,location:o.team||'',ref:id});
  }
  for(const [id,e] of Object.entries(state.data.events)){
    if(typeof e.startAt!=='number') continue;
    out.push({id:'e:'+id,kind:'event',type:EVENT_TYPES[e.type]?e.type:'other',title:e.title||'(ไม่มีชื่อ)',startAt:e.startAt,endAt:typeof e.endAt==='number'?e.endAt:e.startAt,allDay:!!e.allDay,location:e.location||'',ref:id,doc:e});
  }
  return out.sort((a,b)=>(a.startAt-b.startAt)||((a.allDay?0:1)-(b.allDay?0:1)));
}
function itemsOnDay(items,key){ const d0=keyToDate(key).getTime(), d1=d0+DAY-1; return items.filter(x=>x.startAt<=d1&&itemEnd(x)>=d0); }
function shiftMonth(delta){ const c=ui.calMonth; let m=c.m+delta, y=c.y; while(m<0){m+=12;y--;} while(m>11){m-=12;y++;} ui.calMonth={y,m}; ui.calDay=null; render(); }
function defaultEventForm(){
  const base=ui.calDay?keyToDate(ui.calDay):new Date();
  return {title:'',type:'activity',allDay:true,date:isoDate(base),endDate:'',time:'09:00',endTime:'10:00',location:'',description:''};
}
async function renderCalendar(){
  if(!ui.calMonth){ const d=new Date(); ui.calMonth={y:d.getFullYear(),m:d.getMonth()}; }
  const y=ui.calMonth.y, m=ui.calMonth.m; const items=calendarItems();
  const startDow=new Date(y,m,1).getDay(); const daysIn=new Date(y,m+1,0).getDate();
  const todayKey=dayKey(Date.now());
  const head=h('div',{class:'cal-head'},
    h('div',{class:'cal-nav'},
      h('button',{class:'btn sm','aria-label':'เดือนก่อนหน้า',onclick:()=>shiftMonth(-1)},'‹'),
      h('h2',null,TH_MONTHS[m]+' '+(y+543)),
      h('button',{class:'btn sm','aria-label':'เดือนถัดไป',onclick:()=>shiftMonth(1)},'›'),
      h('button',{class:'btn ghost sm',onclick:()=>{ const d=new Date(); ui.calMonth={y:d.getFullYear(),m:d.getMonth()}; ui.calDay=todayKey; render(); }},'วันนี้')),
    canAct()?h('button',{class:'btn primary',onclick:()=>{ ui.showEventForm=!ui.showEventForm; if(ui.showEventForm) ui.eventForm=defaultEventForm(); render(); }},ui.showEventForm?'ปิดฟอร์ม':'+ เพิ่มกิจกรรม'):null);
  const grid=h('div',{class:'cal-grid',role:'grid'},TH_DOW.map(d=>h('div',{class:'cal-dow'},d)));
  for(let i=0;i<startDow;i++) grid.append(h('div',{class:'cal-cell empty'}));
  for(let d=1;d<=daysIn;d++){
    const key=y+'-'+pad2(m+1)+'-'+pad2(d); const list=itemsOnDay(items,key);
    grid.append(h('button',{class:'cal-cell'+(key===todayKey?' today':'')+(ui.calDay===key?' sel':''),'aria-label':d+' '+TH_MONTHS[m]+(list.length?' มี '+list.length+' รายการ':''),'aria-pressed':ui.calDay===key?'true':'false',onclick:()=>{ ui.calDay=ui.calDay===key?null:key; ui.expandedEvent=null; render(); }},
      h('span',{class:'cal-num'},d),
      h('div',{class:'cal-chips'},list.slice(0,3).map(x=>h('span',{class:'cal-chip ev-'+x.type+(x.done?' done':''),title:x.title},x.allDay?'':fmtTime(x.startAt)+' ',x.title)),list.length>3?h('span',{class:'cal-more'},'+'+(list.length-3)+' รายการ'):null),
      list.length?h('span',{class:'cal-dots'},list.slice(0,4).map(x=>h('i',{class:'ev-'+x.type}))):null));
  }
  const legend=h('div',{class:'cal-legend'},[['meeting','ประชุม'],['deadline','ปิดรับ/กำหนดส่ง'],['activity','กิจกรรม'],['training','อบรม'],['holiday','วันหยุด'],['other','อื่นๆ']].map(([k,l])=>h('span',null,h('i',{class:'ev-'+k}),l)));
  const ppl=await people(items.filter(x=>x.kind==='event').map(x=>x.doc.createdBy).concat([state.me.id]));
  const side=h('aside',{class:'cal-side'});
  if(ui.showEventForm&&canAct()) side.append(renderEventForm());
  if(ui.calDay){
    const list=itemsOnDay(items,ui.calDay);
    side.append(h('div',{class:'card pad'},
      h('h3',{style:'display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px'},'วัน'+fmtDay(keyToDate(ui.calDay).getTime()),h('button',{class:'btn ghost sm',onclick:()=>{ ui.calDay=null; render(); }},'ดูที่กำลังจะมาถึง')),
      list.length?h('div',{class:'cal-list'},list.map(x=>renderCalItem(x,ppl))):h('div',{class:'empty-note'},'ไม่มีกิจกรรมในวันนี้'+(canAct()?' กด "+ เพิ่มกิจกรรม" เพื่อสร้าง':''))));
  } else {
    const now=Date.now();
    const upcoming=items.filter(x=>!x.done&&itemEnd(x)>=now&&x.startAt<=now+30*DAY);
    const groups=new Map();
    for(const x of upcoming){ const k=dayKey(Math.max(x.startAt,startOfDay(now))); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(x); }
    const card=h('div',{class:'card pad'},h('h3',{style:'margin-bottom:10px'},'กำลังจะมาถึงใน 30 วัน',h('span',{class:'eyebrow',style:'margin-left:8px'},upcoming.length+' รายการ')));
    if(!groups.size) card.append(h('div',{class:'empty-note'},'ยังไม่มีกิจกรรมใน 30 วันข้างหน้า'));
    for(const [k,list] of groups){
      const ts=keyToDate(k).getTime();
      const lbl=dayLabel(ts), full=fmtDay(ts);
      card.append(h('div',{class:'cal-group'},h('span',{class:'eyebrow'},h('b',null,lbl),lbl===full?'':full),h('div',{class:'cal-list'},list.map(x=>renderCalItem(x,ppl)))));
    }
    side.append(card);
  }
  return h('div',null,head,h('div',{class:'cal-wrap'},h('div',null,grid,legend),side));
}
function renderCalItem(x,ppl){
  const multi=dayKey(x.startAt)!==dayKey(x.endAt||x.startAt);
  const when=x.allDay?(multi?fmtBoard(x.startAt)+' – '+fmtBoard(x.endAt):'ทั้งวัน'):fmtTime(x.startAt)+(x.endAt&&x.endAt>x.startAt?' – '+fmtTime(x.endAt):'');
  const typeLabel=x.kind==='meeting'?'ประชุม':x.kind==='opp'?'ปิดรับสมัคร':(EVENT_TYPES[x.type]||'กิจกรรม');
  const open=ui.expandedEvent===x.id;
  const txt=h('div',{class:'txt'},
    h('button',{class:'cal-title','aria-expanded':open?'true':'false',onclick:()=>{ ui.expandedEvent=open?null:x.id; render(); }},x.title,x.doc&&x.doc.sample?h('span',{class:'chip sample',style:'margin-left:6px;vertical-align:1px'},'ตัวอย่าง'):null),
    h('span',{class:'cal-meta'},h('b',null,when),' · ',typeLabel,x.location?' · '+x.location:''));
  if(open){
    const det=h('div',{class:'cal-detail'});
    if(x.kind==='meeting') det.append(h('button',{class:'btn sm primary',onclick:()=>enterRoom(x.ref)},'เปิดห้องประชุม'));
    else if(x.kind==='opp') det.append(h('button',{class:'btn sm',onclick:()=>{ ui.expandedOpp=x.ref; go('opps'); }},'ดูประกาศ'));
    else {
      const e=x.doc; const creator=ppl[e.createdBy]||{name:'สมาชิก HR'};
      if(e.description) det.append(h('p',null,e.description));
      const going=Array.isArray(e.going)?e.going:[]; const meGoing=going.includes(state.me.id);
      det.append(h('div',{class:'small muted'},'เพิ่มโดย '+creator.name+(going.length?' · เข้าร่วม '+going.length+' คน':'')));
      const acts=h('div',{style:'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px'});
      if(canAct()&&x.type!=='holiday') acts.append(h('button',{class:'btn sm'+(meGoing?' on':''),onclick:async()=>{ const body=clone(e); body.going=going.filter(i=>i!==state.me.id); if(!meGoing) body.going.push(state.me.id); await guarded(()=>setDoc('events',x.ref,body)); }},meGoing?'เข้าร่วมแล้ว':'เข้าร่วม'));
      if((e.createdBy===state.me.id||state.canEdit)&&canAct()) acts.append(h('button',{class:'btn ghost sm danger',onclick:async()=>{ if(confirm('ลบกิจกรรม "'+e.title+'"?')) await guarded(()=>delDoc('events',x.ref)); }},'ลบ'));
      if(acts.childElementCount) det.append(acts);
    }
    txt.append(det);
  }
  return h('div',{class:'cal-item'},h('span',{class:'cal-bar ev-'+x.type}),txt);
}
function renderEventForm(){
  const f=ui.eventForm||(ui.eventForm=defaultEventForm());
  const title=h('input',{id:'ev-title',value:f.title,placeholder:'เช่น ปฐมนิเทศพนักงานใหม่ รุ่น พ.ย.',maxlength:'120',oninput:e=>{f.title=e.target.value;}});
  const type=h('select',{id:'ev-type',onchange:e=>{f.type=e.target.value;}},Object.entries(EVENT_TYPES).map(([k,l])=>h('option',{value:k,selected:f.type===k},l)));
  const allDay=h('label',{class:'check'},h('input',{type:'checkbox',id:'ev-allday',checked:f.allDay,onchange:e=>{ f.allDay=e.target.checked; render(); }}),'ทั้งวัน');
  const date=h('input',{id:'ev-date',type:'date',value:f.date,oninput:e=>{f.date=e.target.value;}});
  const endDate=h('input',{id:'ev-enddate',type:'date',value:f.endDate,oninput:e=>{f.endDate=e.target.value;}});
  const time=h('input',{id:'ev-time',type:'time',value:f.time,oninput:e=>{f.time=e.target.value;}});
  const endTime=h('input',{id:'ev-endtime',type:'time',value:f.endTime,oninput:e=>{f.endTime=e.target.value;}});
  const loc=h('input',{id:'ev-loc',value:f.location,placeholder:'เช่น ศูนย์ฝึกอบรม หรือ ออนไลน์',oninput:e=>{f.location=e.target.value;}});
  const desc=h('textarea',{id:'ev-desc',placeholder:'รายละเอียด (ไม่บังคับ)',style:'min-height:64px',oninput:e=>{f.description=e.target.value;}},f.description);
  const save=h('button',{class:'btn primary',onclick:async()=>{
    if(!f.title.trim()){ toast('ใส่ชื่อกิจกรรม'); return; }
    if(!f.date){ toast('เลือกวันที่'); return; }
    const endD=f.endDate||f.date;
    const startAt=f.allDay?new Date(f.date+'T00:00:00').getTime():new Date(f.date+'T'+(f.time||'09:00')+':00').getTime();
    const endAt=f.allDay?new Date(endD+'T00:00:00').getTime():new Date(endD+'T'+(f.endTime||f.time||'10:00')+':00').getTime();
    if(isNaN(startAt)||isNaN(endAt)){ toast('วันหรือเวลาไม่ถูกต้อง'); return; }
    if(endAt<startAt){ toast('เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม'); return; }
    save.disabled=true;
    const ok=await guarded(()=>setDoc('events',newId('e'),{title:f.title.trim(),type:f.type,allDay:!!f.allDay,startAt,endAt,location:f.location.trim(),description:f.description.trim(),createdBy:state.me.id,createdAt:Date.now(),going:[]}));
    if(ok){ ui.showEventForm=false; ui.eventForm=null; ui.calDay=dayKey(startAt); const d=new Date(startAt); ui.calMonth={y:d.getFullYear(),m:d.getMonth()}; toast('เพิ่มกิจกรรมแล้ว'); render(); } else save.disabled=false;
  }},'บันทึกกิจกรรม');
  return h('div',{class:'card lift pad'},h('div',{class:'form'},
    field('ชื่อกิจกรรม',title),
    h('div',{class:'form-row'},field('ประเภท',type),h('div',{class:'field'},h('label',null,'ช่วงเวลา'),allDay)),
    h('div',{class:'form-row'},field('วันที่เริ่ม',date),field('วันที่สิ้นสุด (ถ้ามี)',endDate)),
    f.allDay?null:h('div',{class:'form-row'},field('เวลาเริ่ม',time),field('เวลาสิ้นสุด',endTime)),
    field('สถานที่',loc),
    field('รายละเอียด',desc),
    h('div',{class:'form-actions'},h('button',{class:'btn',onclick:()=>{ ui.showEventForm=false; render(); }},'ยกเลิก'),save)));
}

/* ---------- boot ---------- */
async function onSignedIn(session){
  if(state.session) return;
  state.session=session;
  const u=session.user;
  state.me={id:u.id,name:(u.user_metadata&&u.user_metadata.name)||(u.email||'').split('@')[0],avatarUrl:'',color:colorFor(u.id)};
  state.auth.signedIn=true; state.status='ready'; render();
  await subscribe();
  initDM();
  callSetup();
}
async function init(){
  render();
  if(sb){
    state.live=true; state.me={id:null,name:'',avatarUrl:'',color:'#6b7b86'};
    sb.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){ state.auth.recovery=true; if(session) onSignedIn(session); render(); return; }
      if(event==='SIGNED_OUT'){ location.reload(); return; }
      if(session) onSignedIn(session);
    });
    const {data}=await sb.auth.getSession();
    if(data&&data.session) await onSignedIn(data.session); else { state.status='ready'; render(); }
  } else {
    state.data=clone(demoData); state.live=false; state.status='ready'; state.dm.ready=true; state.dm.loaded=true; state.dataLoaded=true; state.auth={signedIn:true,busy:false,recovery:false};
  }
  render();
  document.addEventListener('pointerdown',noteActive,{passive:true}); document.addEventListener('keydown',noteActive,{passive:true});
  setInterval(()=>{ if(state.live&&state.auth.signedIn&&Date.now()-lastActive>60*MIN) lockScreen(); },60000);
  document.addEventListener('click',e=>{ if(!ui.panel) return; if(e.target.closest&&(e.target.closest('.panel')||e.target.closest('.icon-btn'))) return; ui.panel=null; render(); });
  document.addEventListener('pointerdown',()=>{ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(_){} } },{once:true});
}
init();
})();
