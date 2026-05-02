---
read_when:
    - Você quer encontrar plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio Plugin
summary: 'Plugins do OpenClaw mantidos pela comunidade: navegue, instale e envie o seu'
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-05-02T20:50:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, provedores ou outras capacidades. Eles são criados e mantidos
pela comunidade, geralmente publicados no [ClawHub](/pt-BR/tools/clawhub), e instaláveis
com um único comando. O Npm continua sendo o padrão inicial para especificações de pacotes avulsas,
enquanto as instalações de packs do ClawHub são disponibilizadas gradualmente.

O ClawHub é a superfície canônica de descoberta para plugins da comunidade. Não abra
PRs somente de documentação apenas para adicionar seu plugin aqui para descoberta; publique-o no
ClawHub em vez disso.

```bash
openclaw plugins install clawhub:<package-name>
```

Use `openclaw plugins install <package-name>` para pacotes hospedados no npm.

## Plugins listados

### Apify

Extraia dados de qualquer site com mais de 20.000 scrapers prontos. Permita que seu agente
extraia dados do Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sites de e-commerce e mais — apenas pedindo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge independente do OpenClaw para conversas do Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela usando texto simples e controle-a com comandos
nativos de chat para retomar, planejar, revisar, selecionar modelo, compactar e mais.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô corporativo usando o modo Stream. Compatível com mensagens de texto,
imagens e arquivos por meio de qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gerenciamento de contexto sem perdas para OpenClaw. Sumarização de conversas
baseada em DAG com Compaction incremental — preserva a fidelidade total do contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta rastreamentos de agente para o Opik. Monitore o comportamento do agente,
custo, tokens, erros e mais.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dê ao seu agente OpenClaw um avatar Live2D com sincronização labial em tempo real,
expressões emocionais e conversão de texto em fala. Inclui ferramentas de criação para geração de assets por IA
e implantação em um clique no Prometheus Marketplace. Atualmente em alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecte o OpenClaw ao QQ pela API do QQ Bot. Compatível com chats privados, menções
em grupo, mensagens de canal e mídia rica, incluindo voz, imagens, vídeos
e arquivos.

As versões atuais do OpenClaw incluem o QQ Bot. Use a configuração incluída em
[QQ Bot](/pt-BR/channels/qqbot) para instalações normais; instale este plugin externo somente
quando você quiser intencionalmente o pacote autônomo mantido pela Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw pela equipe Tencent WeCom. Baseado em
conexões persistentes via WeCom Bot WebSocket, ele oferece suporte a mensagens diretas e chats em grupo,
respostas por streaming, mensagens proativas, processamento de imagens/arquivos, formatação Markdown,
controle de acesso integrado e Skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin de canal Yuanbao para OpenClaw pela equipe Tencent Yuanbao. Baseado em
conexões persistentes via WebSocket, ele oferece suporte a mensagens diretas e chats em grupo,
respostas por streaming, mensagens proativas, processamento de imagens/arquivos/áudio/vídeo,
formatação Markdown, controle de acesso integrado e menus de comandos slash.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Envie seu plugin

Aceitamos plugins da comunidade que sejam úteis, documentados e seguros de operar.

<Steps>
  <Step title="Publish to ClawHub or npm">
    Seu plugin deve ser instalável via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/pt-BR/tools/clawhub), a menos que você precise especificamente de distribuição
    somente por npm.
    Consulte [Criando Plugins](/pt-BR/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Host on GitHub">
    O código-fonte deve estar em um repositório público com documentação de configuração e um rastreador
    de issues.

  </Step>

  <Step title="Use docs PRs only for source-doc changes">
    Você não precisa de um PR de documentação apenas para tornar seu plugin descobrível. Publique-o
    no ClawHub em vez disso.

    Abra um PR de documentação somente quando a documentação-fonte do OpenClaw precisar de uma alteração real de conteúdo,
    como corrigir orientações de instalação ou adicionar documentação entre repositórios
    que pertença ao conjunto principal de documentação.

  </Step>
</Steps>

## Padrão de qualidade

| Requisito                   | Por quê                                        |
| --------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou npm | Os usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub | Revisão de código-fonte, rastreamento de issues, transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo |
| Manutenção ativa            | Atualizações recentes ou tratamento responsivo de issues |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionado

- [Instalar e Configurar Plugins](/pt-BR/tools/plugin) — como instalar qualquer plugin
- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie o seu próprio
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema do manifesto
