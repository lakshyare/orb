/* ===== SUPABASE CLIENT ===== */

var SUPABASE_URL = 'https://iebcxkyqczzgqbyrlhbf.supabase.co';
var SUPABASE_KEY = 'sb_publishable_nEYZbjDoRCtlr4CEyMdGsQ_bAlRSNzl';

var _supabase = null;

function initSupabase(){
    if(_supabase) return _supabase;
    if(typeof supabase === 'undefined'){
        console.warn('Supabase SDK not loaded');
        return null;
    }
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _supabase;
}