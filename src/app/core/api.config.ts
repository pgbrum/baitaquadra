// URL base do backend .NET (backend/BaitaQuadra.Api). Ajuste para a URL publicada em produção.
export const API_URL = 'http://localhost:5080/api';

// true = modo demonstração: o front usa dados locais (core/mock) e não precisa da API nem do banco.
// Mude para false quando o backend estiver conectado ao Supabase.
export const USE_MOCK = true;
