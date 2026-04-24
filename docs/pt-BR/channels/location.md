---
read_when:
    - Adicionando ou modificando a análise de localização do canal
    - Usando campos de contexto de localização em prompts ou ferramentas do agente
summary: Análise de localização do canal de entrada (Telegram/WhatsApp/Matrix) e campos de contexto
title: Análise de localização do canal
x-i18n:
    generated_at: "2026-04-24T05:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
---

O OpenClaw normaliza localizações compartilhadas de canais de chat em:

- texto conciso de coordenadas anexado ao corpo de entrada, e
- campos estruturados na carga de contexto de resposta automática. Rótulos, endereços e legendas/comentários fornecidos pelo canal são renderizados no prompt pelo bloco JSON compartilhado de metadados não confiáveis, não inline no corpo do usuário.

Atualmente compatível com:

- **Telegram** (pins de localização + locais + localizações ao vivo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` com `geo_uri`)

## Formatação de texto

As localizações são renderizadas como linhas amigáveis sem colchetes:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Local nomeado:
  - `📍 48.858844, 2.294351 ±12m`
- Compartilhamento ao vivo:
  - `🛰 Localização ao vivo: 48.858844, 2.294351 ±12m`

Se o canal incluir um rótulo, endereço ou legenda/comentário, isso será preservado na carga de contexto e aparecerá no prompt como JSON não confiável delimitado:

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Campos de contexto

Quando uma localização está presente, estes campos são adicionados a `ctx`:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, metros; opcional)
- `LocationName` (string; opcional)
- `LocationAddress` (string; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; opcional)

O renderizador de prompt trata `LocationName`, `LocationAddress` e `LocationCaption` como metadados não confiáveis e os serializa pelo mesmo caminho JSON limitado usado para outros contextos de canal.

## Observações por canal

- **Telegram**: locais são mapeados para `LocationName/LocationAddress`; localizações ao vivo usam `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` preenchem `LocationCaption`.
- **Matrix**: `geo_uri` é analisado como uma localização de pin; a altitude é ignorada e `LocationIsLive` é sempre false.

## Relacionado

- [Comando de localização (nodes)](/pt-BR/nodes/location-command)
- [Captura de câmera](/pt-BR/nodes/camera)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
