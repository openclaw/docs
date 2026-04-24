---
read_when:
    - Adicionar suporte de Node de localização ou interface de permissões
    - Projetar permissões de localização no Android ou comportamento em foreground
summary: Comando de localização para Nodes (`location.get`), modos de permissão e comportamento de foreground no Android
title: Comando de localização
x-i18n:
    generated_at: "2026-04-24T05:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## Resumo

- `location.get` é um comando de Node (via `node.invoke`).
- Desativado por padrão.
- As configurações do app Android usam um seletor: Desativado / Durante o uso.
- Alternância separada: Localização precisa.

## Por que um seletor (e não apenas um interruptor)

Permissões do SO são multinível. Podemos expor um seletor no app, mas o SO ainda decide a concessão real.

- iOS/macOS podem expor **Durante o uso** ou **Sempre** nos prompts/configurações do sistema.
- O app Android atualmente oferece suporte apenas a localização em foreground.
- Localização precisa é uma concessão separada (iOS 14+ “Precisa”, Android “fine” vs “coarse”).

O seletor na interface define nosso modo solicitado; a concessão real fica nas configurações do SO.

## Modelo de configuração

Por dispositivo Node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento da interface:

- Selecionar `whileUsing` solicita permissão em foreground.
- Se o SO negar o nível solicitado, reverte para o nível mais alto concedido e mostra o status.

## Mapeamento de permissões (`node.permissions`)

Opcional. O node macOS reporta `location` via mapa de permissões; iOS/Android podem omiti-lo.

## Comando: `location.get`

Chamado via `node.invoke`.

Parâmetros (sugeridos):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload de resposta:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erros (códigos estáveis):

- `LOCATION_DISABLED`: o seletor está desativado.
- `LOCATION_PERMISSION_REQUIRED`: permissão ausente para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: o app está em segundo plano, mas só é permitido Durante o uso.
- `LOCATION_TIMEOUT`: nenhuma posição obtida a tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema / nenhum provider.

## Comportamento em segundo plano

- O app Android nega `location.get` quando está em segundo plano.
- Mantenha o OpenClaw aberto ao solicitar localização no Android.
- Outras plataformas de Node podem se comportar de forma diferente.

## Integração com modelo/ferramentas

- Superfície de ferramenta: a ferramenta `nodes` adiciona a ação `location_get` (Node obrigatório).
- CLI: `openclaw nodes location get --node <id>`.
- Diretrizes do agente: chame apenas quando o usuário tiver ativado a localização e entendido o escopo.

## Texto de UX (sugerido)

- Desativado: “O compartilhamento de localização está desativado.”
- Durante o uso: “Somente quando o OpenClaw estiver aberto.”
- Precisa: “Use localização GPS precisa. Desative para compartilhar localização aproximada.”

## Relacionado

- [Análise de localização de canal](/pt-BR/channels/location)
- [Captura de câmera](/pt-BR/nodes/camera)
- [Modo Talk](/pt-BR/nodes/talk)
