import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const questions = [
  {
    question: 'O visitante sabe para onde será direcionado?',
    answer: 'Sim. O AinzLink mostra o domínio final antes de qualquer redirecionamento. A pessoa pode conferir, cancelar ou denunciar o link.',
  },
  {
    question: 'O AinzLink armazena o IP de quem acessa?',
    answer: 'Não. As estatísticas apresentam apenas informações agregadas, como país e tipo de dispositivo. O endereço IP não aparece para o criador do link.',
  },
  {
    question: 'Como funcionam os destinos alternativos?',
    answer: 'Você pode dividir os acessos entre duas páginas ou criar regras para celular e país. Antes de continuar, o visitante sempre vê o domínio que realmente será aberto.',
  },
  {
    question: 'O QR Code continua disponível depois?',
    answer: 'Sim. Links associados à sua conta ficam no dashboard com QR Code, opções de personalização, download e compartilhamento da imagem junto com o endereço.',
  },
  {
    question: 'O que acontece quando um link é denunciado?',
    answer: 'A denúncia é registrada para moderação e pode ser enviada novamente quando necessário. O Turnstile ajuda a reduzir automações abusivas sem exigir que o AinzLink exponha o IP do visitante.',
  },
  {
    question: 'Preciso entrar com o Google para criar um link?',
    answer: 'Você pode criar sem entrar. Ao usar sua conta Google, os links ficam reunidos no dashboard e podem ser gerenciados em outros dispositivos.',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="duvidas" className="faq-section">
      <div className="app-shell faq-layout">
        <div>
          <span className="eyebrow">Central de dúvidas</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">Tudo claro antes do clique.</h2>
          <p className="muted mt-4 leading-7">Respostas diretas sobre segurança, privacidade e gerenciamento dos seus links.</p>
        </div>
        <div className="faq-list">
          {questions.map((item, index) => (
            <div className="faq-item" key={item.question}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
              >
                <span>{item.question}</span>
                <FiChevronDown className={`shrink-0 transition-transform ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <p className="faq-answer">{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
