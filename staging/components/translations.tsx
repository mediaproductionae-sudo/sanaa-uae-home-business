'use client';
import {useState} from 'react';
import {TranslationEditor} from '../../components/translation-editor';
import type {LocalizedContent} from '../../lib/i18n/content';
export function DatabaseTranslations({item,store=false}:{item?:LocalizedContent;store?:boolean}){const [value,setValue]=useState<LocalizedContent>(item||{name:'',description:'',originalLanguage:'ar'}),original=store?'ar':value.originalLanguage||'ar',second=original==='ar'?'en':'ar',translated=value.translations?.[second];return <><input type="hidden" name="originalLanguage" value={original}/><input type="hidden" name="translationName" value={translated?.name||''}/><input type="hidden" name="translationDescription" value={translated?.description||''}/><input type="hidden" name="translationApproved" value={translated?.approved?'on':''}/><TranslationEditor item={value} store={store} onChange={setValue}/></>}
