---
read_when:
    - Adição de suporte a Node de localização ou interface de permissões
    - Projetando permissões de localização ou comportamento em primeiro plano no Android
summary: Comando de localização para Nodes (location.get), modos de permissão e comportamento em primeiro plano no Android
title: Comando de localização
x-i18n:
    generated_at: "2026-07-12T00:06:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Resumo

- `location.get` é um comando de Node, invocado por meio de `node.invoke` ou `openclaw nodes location get`.
- Desativado por padrão.
- Compilações Android de terceiros usam um seletor: Desativado / Durante o uso / Sempre. As compilações da Play permanecem com Desativado / Durante o uso.
- Localização precisa é uma opção separada.

## Por que um seletor (e não apenas um botão)

As permissões de localização do sistema operacional têm vários níveis. A localização precisa também é uma concessão separada do sistema operacional ("Precisa" no iOS 14+, "fine" em comparação com "coarse" no Android). O seletor no aplicativo determina o modo solicitado, mas o sistema operacional ainda decide a concessão efetiva.

## Modelo de configurações

Por dispositivo Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamento da interface:

- Selecionar `whileUsing` solicita permissão em primeiro plano.
- Selecionar `always` na compilação Android de terceiros primeiro solicita permissão em primeiro plano, explica o acesso em segundo plano e, em seguida, abre as configurações do aplicativo no Android para a concessão separada **Allow all the time**.
- As compilações Android da Play não declaram a permissão de localização em segundo plano nem exibem `always`.
- Se o sistema operacional negar o nível solicitado, o aplicativo reverte para o nível concedido mais alto e exibe o status.

## Mapeamento de permissões (node.permissions)

Opcional. O Node do macOS informa `location` por meio do mapa `permissions` em `node.list`/`node.describe`; iOS/Android podem omiti-lo.

## Comando: `location.get`

Chamado por meio de `node.invoke` ou do auxiliar da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parâmetros:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

As opções da CLI são mapeadas diretamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_PERMISSION_REQUIRED`: falta a permissão para o modo solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE`: o aplicativo está em segundo plano, mas apenas Durante o uso foi concedido.
- `LOCATION_TIMEOUT`: nenhuma localização foi obtida a tempo.
- `LOCATION_UNAVAILABLE`: falha do sistema ou nenhum provedor disponível.

## Comportamento em segundo plano

- As compilações Android de terceiros aceitam `location.get` em segundo plano somente quando o usuário selecionou `Always` e o Android concedeu a localização em segundo plano. O serviço persistente de Node existente adiciona o tipo de serviço `location` e informa `Location: Always` enquanto está ativo.
- As compilações Android da Play e o modo `While Using` negam `location.get` enquanto o aplicativo está em segundo plano.
- Outras plataformas de Node podem apresentar comportamentos diferentes.

## Integração com modelos e ferramentas

- Ferramenta do agente: a ação `location_get` da ferramenta `nodes` (Node obrigatório).
- CLI: `openclaw nodes location get --node <id>`.
- Diretrizes do agente: chamar somente quando o usuário tiver ativado a localização e compreender o escopo.

## Texto da experiência do usuário (sugerido)

- Desativado: "O compartilhamento de localização está desativado."
- Durante o uso: "Somente quando o OpenClaw estiver aberto."
- Sempre: "Permitir verificações de localização solicitadas enquanto o OpenClaw estiver em segundo plano."
- Precisa: "Usar a localização GPS precisa. Desative para compartilhar a localização aproximada."

## Relacionados

- [Visão geral dos Nodes](/pt-BR/nodes)
- [Análise de localização dos canais](/pt-BR/channels/location)
- [Captura da câmera](/pt-BR/nodes/camera)
- [Modo de conversa](/pt-BR/nodes/talk)
