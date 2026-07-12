---
read_when:
    - Adição ou modificação da análise de localização do canal
    - Uso de campos de contexto de localização em prompts ou ferramentas do agente
summary: Análise de localização do canal e payloads portáveis de localização de saída
title: Análise da localização do canal
x-i18n:
    generated_at: "2026-07-12T14:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

O OpenClaw normaliza locais compartilhados de canais de chat em:

- texto conciso de coordenadas anexado ao corpo da mensagem recebida; e
- campos estruturados na carga útil de contexto da resposta automática. Rótulos, endereços e legendas/comentários fornecidos pelo canal são renderizados no prompt pelo bloco JSON compartilhado de metadados não confiáveis, e não diretamente no corpo da mensagem do usuário.

Compatibilidade atual:

- **LINE** (mensagens de localização com título/endereço)
- **Matrix** (`m.location` com `geo_uri`)
- **Telegram** (marcadores de localização + locais + localizações ao vivo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Formatação de texto

As localizações são exibidas como linhas de fácil leitura, sem colchetes. As coordenadas usam seis casas decimais; a precisão é arredondada para metros inteiros:

- Localização fixada:
  - `📍 48.858844, 2.294351 ±12m`
- Local nomeado (na mesma linha; o nome/endereço vão apenas para o bloco de metadados):
  - `📍 48.858844, 2.294351 ±12m`
- Compartilhamento ao vivo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Se o canal incluir um rótulo, endereço ou legenda/comentário, ele será preservado no payload de contexto e aparecerá no prompt como JSON não confiável delimitado por cercas (os campos serão omitidos quando estiverem ausentes):

````text
Localização (metadados não confiáveis):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Campos de contexto

Quando uma localização está presente, estes campos são adicionados a `ctx`:

- `LocationLat` (número)
- `LocationLon` (número)
- `LocationAccuracy` (número, metros; opcional)
- `LocationName` (string; opcional)
- `LocationAddress` (string; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)
- `LocationCaption` (string; opcional)

Quando o canal não define uma origem explícita, o OpenClaw a infere: compartilhamentos ao vivo se tornam `live`, localizações com nome ou endereço se tornam `place` e todo o restante é `pin`.

O renderizador de prompts trata `LocationName`, `LocationAddress` e `LocationCaption` como metadados não confiáveis e os serializa pelo mesmo caminho JSON com limites usado para outros contextos do canal.

## Payloads de saída

A ferramenta de mensagens e o SDK de Plugin usam a mesma estrutura `NormalizedLocation` para localizações de saída portáveis. Um payload somente com coordenadas representa um marcador. Canais com suporte nativo a locais podem mapear `name` mais `address` para um cartão de local.

Atualmente, o Telegram disponibiliza isso por meio de `message(action="send")`. Sua primeira implementação é deliberadamente independente: payloads de localização não podem ser combinados com texto ou mídia, e pares de local incompletos geram falha em vez de descartar silenciosamente um nome ou endereço. Canais sem suporte não anunciam o parâmetro de localização.

## Observações sobre os canais

- **LINE**: `title`/`address` da mensagem de localização são mapeados para `LocationName`/`LocationAddress`; sem localizações ao vivo.
- **Matrix**: `geo_uri` é analisado como uma localização de marcador; o parâmetro `u` (incerteza) é mapeado para `LocationAccuracy`, o corpo do evento preenche `LocationCaption`, a altitude é ignorada e `LocationIsLive` é sempre falso.
- **Telegram**: locais são mapeados para `LocationName`/`LocationAddress`; localizações ao vivo são detectadas por meio de `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` preenchem `LocationCaption`.

## Relacionado

- [Comando de localização (nodes)](/pt-BR/nodes/location-command)
- [Captura da câmera](/pt-BR/nodes/camera)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
