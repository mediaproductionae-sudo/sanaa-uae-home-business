import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function moduleAt(file,dependencies={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,resolveJsonModule:true}}).outputText;new Function('require','module','exports',code)(name=>dependencies[name],module,module.exports);return module.exports}
const {contentField,contentLanguage,searchable,cleanTranslations}=moduleAt('lib/i18n/content.ts');
const {translate}=moduleAt('lib/i18n/translate.ts',{'./en.json':JSON.parse(fs.readFileSync('lib/i18n/en.json','utf8'))});
const product={id:7,name:'جديد',description:'وصف أصلي',price:14525,originalLanguage:'ar',translations:{en:{name:'New bowl',description:'',approved:false}}},snapshot=JSON.stringify(product);
assert.equal(contentField(product,'name','en'),'جديد');assert.equal(contentLanguage(product,'name','en'),'ar');assert.equal(JSON.stringify(product),snapshot);assert.ok(!searchable(product).includes('New bowl'));
product.translations.en.approved=true;assert.equal(contentField(product,'name','en'),'New bowl');assert.equal(contentField(product,'description','en'),'وصف أصلي');assert.equal(contentLanguage(product,'description','en'),'ar');assert.equal(contentField(product,'name','ar'),'جديد');assert.ok(searchable(product).includes('new bowl'));assert.equal(product.id,7);assert.equal(product.price,14525);
assert.equal(contentField({name:'Original English',description:'English text',originalLanguage:'en'},'name','ar'),'Original English');assert.deepEqual(cleanTranslations({fr:{name:'Unsupported'},en:{name:'English',approved:true}}),{en:{name:'English',description:'',approved:true}});
assert.equal(translate('جديد','en'),'New');assert.equal(translate('تسجيل الدخول','en'),'Sign in');assert.equal(translate('تسجيل الدخول','ar'),'تسجيل الدخول');assert.equal(translate(129.5,'en'),129.5);assert.equal(translate('145 د.إ','en'),'145 AED');
console.log('PASS content/UI separation, optional and unapproved translations, per-field original fallback, English originals, approved bilingual indexing, unchanged IDs/prices and formatting.');
