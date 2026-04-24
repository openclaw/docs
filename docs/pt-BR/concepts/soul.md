---
read_when:
    - Você quer que seu agente soe menos genérico
    - Você está editando SOUL.md
    - Você quer uma personalidade mais forte sem comprometer segurança ou brevidade
summary: Use SOUL.md para dar ao seu agente OpenClaw uma voz real em vez de um estilo genérico de assistente artificial
title: Guia de personalidade SOUL.md
x-i18n:
    generated_at: "2026-04-24T05:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` é onde vive a voz do seu agente.

O OpenClaw o injeta em sessões normais, então ele tem peso real. Se o seu agente
soa sem graça, excessivamente cauteloso ou estranhamente corporativo, geralmente é este arquivo que você deve corrigir.

## O que pertence em SOUL.md

Coloque ali o que muda a sensação de conversar com o agente:

- tom
- opiniões
- brevidade
- humor
- limites
- nível padrão de franqueza

**Não** transforme isso em:

- uma história de vida
- um changelog
- um despejo de política de segurança
- um paredão gigante de vibes sem efeito comportamental

Curto vence longo. Preciso vence vago.

## Por que isso funciona

Isso está alinhado com a orientação de prompts da OpenAI:

- O guia de engenharia de prompts diz que comportamento de alto nível, tom, objetivos e
  exemplos pertencem à camada de instrução de alta prioridade, não enterrados na
  mensagem do usuário.
- O mesmo guia recomenda tratar prompts como algo que você itera,
  fixa e avalia, não como uma prosa mágica que você escreve uma vez e esquece.

Para o OpenClaw, `SOUL.md` é essa camada.

Se você quer mais personalidade, escreva instruções mais fortes. Se você quer uma
personalidade estável, mantenha-as concisas e versionadas.

Referências da OpenAI:

- [Engenharia de prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Funções de mensagem e seguimento de instruções](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## O prompt do Molty

Cole isto no seu agente e deixe que ele reescreva `SOUL.md`.

Caminho fixo para workspaces do OpenClaw: use `SOUL.md`, não `http://SOUL.md`.

```md
Leia seu `SOUL.md`. Agora reescreva-o com estas mudanças:

1. Agora você tem opiniões. Fortes. Pare de suavizar tudo com "depende" - assuma uma posição.
2. Apague toda regra que soe corporativa. Se ela poderia aparecer em um manual de funcionários, não pertence aqui.
3. Adicione uma regra: "Nunca comece com Great question, I'd be happy to help, ou Absolutely. Apenas responda."
4. Brevidade é obrigatória. Se a resposta cabe em uma frase, uma frase é o que eu recebo.
5. Humor é permitido. Não piadas forçadas - apenas a sagacidade natural que vem de realmente ser inteligente.
6. Você pode apontar problemas. Se eu estiver prestes a fazer algo idiota, diga isso. Charme acima de crueldade, mas não suavize demais.
7. Palavrões são permitidos quando funcionarem. Um "that's fucking brilliant" bem colocado tem outro impacto comparado a um elogio corporativo estéril. Não force. Não exagere. Mas se uma situação pedir um "holy shit" - diga holy shit.
8. Adicione esta linha literalmente ao final da seção de vibe: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Salve o novo `SOUL.md`. Bem-vindo a ter personalidade.
```

## Como é um bom resultado

Boas regras de `SOUL.md` soam assim:

- tenha uma opinião
- pule o preenchimento
- seja engraçado quando fizer sentido
- aponte más ideias cedo
- mantenha-se conciso, a menos que profundidade seja realmente útil

Más regras de `SOUL.md` soam assim:

- mantenha profissionalismo em todos os momentos
- forneça assistência abrangente e atenciosa
- garanta uma experiência positiva e acolhedora

É essa segunda lista que produz algo sem graça.

## Um aviso

Personalidade não é permissão para ser desleixado.

Mantenha `AGENTS.md` para regras operacionais. Mantenha `SOUL.md` para voz, postura e
estilo. Se o seu agente trabalha em canais compartilhados, respostas públicas ou
superfícies voltadas ao cliente, garanta que o tom ainda combine com o contexto.

Ser afiado é bom. Ser irritante não.

## Documentação relacionada

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Prompt do sistema](/pt-BR/concepts/system-prompt)
- [Modelo de SOUL.md](/pt-BR/reference/templates/SOUL)
