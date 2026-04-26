---
read_when:
    - Você quer encontrar Plugins de terceiros do OpenClaw
    - Você quer publicar ou listar o seu próprio Plugin
summary: 'Plugins do OpenClaw mantidos pela comunidade: navegue, instale e envie o seu próprio'
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-04-26T11:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, provedores ou outras capabilities. Eles são criados e mantidos
pela comunidade, publicados no [ClawHub](/pt-BR/tools/clawhub) ou no npm, e
podem ser instalados com um único comando.

O ClawHub é a superfície canônica de descoberta para Plugins da comunidade. Não abra
PRs apenas de documentação só para adicionar seu Plugin aqui por motivos de descobribilidade; publique-o no
ClawHub em vez disso.

```bash
openclaw plugins install <package-name>
```

O OpenClaw verifica primeiro o ClawHub e faz fallback para o npm automaticamente.

## Plugins listados

### Apify

Extraia dados de qualquer site com mais de 20.000 scrapers prontos. Deixe seu agente
extrair dados do Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sites de e-commerce e mais — apenas pedindo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge independente do OpenClaw para conversas do Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela usando texto simples e controle-a com comandos nativos de chat para retomada, planejamento, revisão, seleção de modelo, Compaction e mais.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô corporativo usando o modo Stream. Oferece suporte a texto, imagens e
mensagens de arquivo por meio de qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management para OpenClaw. Sumarização de conversa
baseada em DAG com Compaction incremental — preserva fidelidade total de contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta traces de agente para o Opik. Monitore o comportamento do agente,
custo, tokens, erros e mais.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dê ao seu agente OpenClaw um avatar Live2D com sincronização labial em tempo real, expressões de
emoção e text-to-speech. Inclui ferramentas de criação para geração de assets com IA
e implantação com um clique no Prometheus Marketplace. Atualmente em alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecte o OpenClaw ao QQ via a API do QQ Bot. Oferece suporte a chats privados, menções em grupo,
mensagens em canal e mídia avançada, incluindo voz, imagens, vídeos
e arquivos.

As versões atuais do OpenClaw incluem QQ Bot. Use a configuração incluída em
[QQ Bot](/pt-BR/channels/qqbot) para instalações normais; instale este Plugin externo apenas
quando quiser intencionalmente o pacote independente mantido pela Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw da equipe Tencent WeCom. Baseado em
conexões persistentes WebSocket do WeCom Bot, oferece suporte a mensagens diretas e chats em grupo,
respostas em streaming, mensagens proativas, processamento de imagem/arquivo, formatação Markdown,
controle de acesso integrado e Skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envie o seu Plugin

Damos boas-vindas a Plugins da comunidade que sejam úteis, documentados e seguros para operar.

<Steps>
  <Step title="Publicar no ClawHub ou npm">
    Seu Plugin precisa poder ser instalado via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/pt-BR/tools/clawhub) (preferido) ou no npm.
    Consulte [Criando Plugins](/pt-BR/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Hospedar no GitHub">
    O código-fonte precisa estar em um repositório público com documentação de configuração e um
    rastreador de issues.

  </Step>

  <Step title="Use PRs de documentação apenas para mudanças na documentação-fonte">
    Você não precisa de um PR de documentação apenas para tornar seu Plugin encontrável. Publique-o
    no ClawHub em vez disso.

    Abra um PR de documentação apenas quando a documentação-fonte do OpenClaw precisar de uma
    mudança real de conteúdo, como corrigir instruções de instalação ou adicionar
    documentação entre repositórios que pertença ao conjunto principal de docs.

  </Step>
</Steps>

## Barra de qualidade

| Requisito                  | Motivo                                        |
| -------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou npm | Os usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub | Revisão de código-fonte, rastreamento de issues, transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo |
| Manutenção ativa           | Atualizações recentes ou tratamento responsivo de issues |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionado

- [Instalar e configurar Plugins](/pt-BR/tools/plugin) — como instalar qualquer Plugin
- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie o seu
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
