---
read_when:
    - Adição de suporte a nó de localização ou interface de permissões
    - Projetando permissões de localização do Android ou comportamento em primeiro plano
summary: Comando de localização para nós (location.get), modos de permissão e comportamento em primeiro plano no Android
title: Comando de localização
x-i18n:
    generated_at: "2026-05-06T06:02:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## Resumo

- `location.get` é um comando de nó (via `node.invoke`).
- Desativado por padrão.
- As configurações do app Android usam um seletor: Desativado / Durante o uso.
- Alternância separada: Localização precisa.

## Por que um seletor (e não apenas um interruptor)

As permissões do SO têm vários níveis. Podemos expor um seletor no app, mas o SO ainda decide a concessão real.

- iOS/macOS podem expor **Durante o uso** ou **Sempre** em prompts/configurações do sistema.
- O app Android atualmente dá suporte apenas à localização em primeiro plano.
- A localização precisa é uma concessão separada (iOS 14+ "Precisa", Android "precisa" vs "aproximada").

O seletor na interface direciona o modo solicitado; a concessão real fica nas configurações do SO.

## Modelo de configurações

Por dispositivo de nó:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento da interface:

- Selecionar `whileUsing` solicita permissão em primeiro plano.
- Se o SO negar o nível solicitado, reverter para o nível mais alto concedido e mostrar o status.

## Mapeamento de permissões (node.permissions)

Opcional. O nó macOS relata `location` pelo mapa de permissões; iOS/Android podem omiti-lo.

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

Carga útil da resposta:

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
- `LOCATION_PERMISSION_REQUIRED`: falta permissão para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: o app está em segundo plano, mas apenas Durante o uso é permitido.
- `LOCATION_TIMEOUT`: nenhuma posição obtida a tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema / nenhum provedor.

## Comportamento em segundo plano

- O app Android nega `location.get` quando está em segundo plano.
- Mantenha o OpenClaw aberto ao solicitar localização no Android.
- Outras plataformas de nó podem ser diferentes.

## Integração de modelo/ferramentas

- Superfície de ferramenta: a ferramenta `nodes` adiciona a ação `location_get` (nó obrigatório).
- CLI: `openclaw nodes location get --node <id>`.
- Diretrizes para agente: chamar apenas quando o usuário tiver ativado a localização e entender o escopo.

## Texto de UX (sugerido)

- Desativado: "O compartilhamento de localização está desativado."
- Durante o uso: "Somente quando o OpenClaw está aberto."
- Precisa: "Use localização GPS precisa. Desative para compartilhar localização aproximada."

## Relacionado

- [Análise de localização do canal](/pt-BR/channels/location)
- [Captura de câmera](/pt-BR/nodes/camera)
- [Modo de conversa](/pt-BR/nodes/talk)
