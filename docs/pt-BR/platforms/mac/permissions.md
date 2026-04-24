---
read_when:
    - Depurando prompts de permissão do macOS ausentes ou travados
    - Empacotando ou assinando o app do macOS
    - Alterando IDs de bundle ou caminhos de instalação do app
summary: Persistência de permissões no macOS (TCC) e requisitos de assinatura
title: Permissões do macOS
x-i18n:
    generated_at: "2026-04-24T06:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

Concessões de permissão no macOS são frágeis. O TCC associa uma concessão de permissão à
assinatura de código do app, ao identificador do bundle e ao caminho no disco. Se qualquer um deles mudar,
o macOS trata o app como novo e pode remover ou ocultar prompts.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o app a partir de um local fixo (para OpenClaw, `dist/OpenClaw.app`).
- Mesmo identificador de bundle: alterar o ID do bundle cria uma nova identidade de permissão.
- App assinado: builds sem assinatura ou com assinatura ad-hoc não persistem permissões.
- Assinatura consistente: use um certificado real Apple Development ou Developer ID
  para que a assinatura permaneça estável entre rebuilds.

Assinaturas ad-hoc geram uma nova identidade a cada build. O macOS esquecerá concessões anteriores,
e os prompts podem desaparecer completamente até que as entradas obsoletas sejam limpas.

## Checklist de recuperação quando os prompts desaparecem

1. Feche o app.
2. Remova a entrada do app em Ajustes do Sistema -> Privacidade e Segurança.
3. Reabra o app a partir do mesmo caminho e conceda novamente as permissões.
4. Se o prompt ainda não aparecer, redefina as entradas TCC com `tccutil` e tente novamente.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinição (substitua o ID do bundle conforme necessário):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Desktop/Documents/Downloads)

O macOS também pode restringir Desktop, Documents e Downloads para processos de terminal/em segundo plano. Se leituras de arquivo ou listagens de diretório travarem, conceda acesso ao mesmo contexto de processo que executa as operações de arquivo (por exemplo Terminal/iTerm, app iniciado por LaunchAgent ou processo SSH).

Solução alternativa: mova os arquivos para o workspace do OpenClaw (`~/.openclaw/workspace`) se quiser evitar concessões por pasta.

Se você estiver testando permissões, sempre assine com um certificado real. Builds ad-hoc
só são aceitáveis para execuções locais rápidas em que permissões não importam.

## Relacionado

- [App do macOS](/pt-BR/platforms/macos)
- [Assinatura no macOS](/pt-BR/platforms/mac/signing)
