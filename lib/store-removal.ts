import type {State} from '../components/demo-state';
import {itemPrice,itemStore} from './seller-data';
/** Remove the operational catalog, retaining complaint and historical order records. */
export function removeOwnedStore(state:State,id:number):{state:State;error:string}{
 const store=state.stores.find(s=>s.id===id);
 if(state.user?.role!=='seller'||!state.ownedStores.includes(id)||!store)return {state,error:'لا يمكنك حذف متجر لا تملكه.'};
 const removed=new Set(state.products.filter(p=>p.storeId===id).map(p=>p.id)),owned=state.ownedStores.filter(n=>n!==id);
 const orders=state.orders.map(order=>({...order,items:order.items.map(line=>itemStore(line,state.products)===id?{...line,name:line.name||state.products.find(p=>p.id===line.productId)?.name||'منتج محذوف',price:itemPrice(line,state.products),storeId:id}:line)}));
 return {error:'',state:{...state,stores:state.stores.filter(s=>s.id!==id),products:state.products.filter(p=>p.storeId!==id),ownedStores:owned,sellerStoreId:state.sellerStoreId===id?owned[0]||0:state.sellerStoreId,favorites:state.favorites.filter(n=>!removed.has(n)),cart:state.cart.filter(line=>!removed.has(line.productId)),orders,deletedStores:{...state.deletedStores,[id]:{name:store.name,emirate:store.emirate,category:store.category}},gov:{...state.gov,audit:[{id:'STORE-DELETE-'+Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36)).join('-'),action:'حذف متجر',target:'store:'+id,actor:state.user.name,at:new Date().toISOString(),before:{id,name:store.name,productCount:removed.size},after:{removed:true},reason:'حذف المتجر بواسطة مالكه مع الاحتفاظ بسجلات الطلبات والشكاوى'},...state.gov.audit]}}};
}
