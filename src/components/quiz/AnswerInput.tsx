import { SendHorizontal } from "lucide-react";
import type { FormEvent } from "react";

interface AnswerInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function AnswerInput({ value, disabled, onChange, onSubmit }: AnswerInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="answer-form" onSubmit={handleSubmit}>
      <label htmlFor="movie-answer">영화 제목</label>
      <div className="answer-form__row">
        <input
          id="movie-answer"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="제목을 입력하세요"
          autoComplete="off"
        />
        <button type="submit" disabled={disabled || !value.trim()} aria-label="정답 제출">
          <SendHorizontal size={18} />
        </button>
      </div>
    </form>
  );
}
