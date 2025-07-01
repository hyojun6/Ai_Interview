// import React, { useState } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [field, setField] = useState('');
//   const [level, setLevel] = useState('초급');
//   const [count, setCount] = useState(3);
//   const [questions, setQuestions] = useState([]);

//   const handleSubmit = async () => {
//     try {
//       const res = await axios.post('http://localhost:8000/api/questions', {
//         field,
//         level,
//         count: Number(count),
//       });
//       setQuestions(res.data.questions);
//     } catch (err) {
//       console.error('질문 생성 실패:', err);
//     }
//   };

//   return (
//     <div className="App" style={{ padding: '2rem', fontFamily: 'Arial' }}>
//       <h1>🧠 AI 면접 연습</h1>

//       <input
//         type="text"
//         placeholder="희망 분야 (예: 백엔드)"
//         value={field}
//         onChange={(e) => setField(e.target.value)}
//         style={{ marginBottom: '10px', padding: '8px' }}
//       />

//       <div>
//         <label>
//           <input
//             type="radio"
//             name="level"
//             value="초급"
//             checked={level === '초급'}
//             onChange={(e) => setLevel(e.target.value)}
//           />
//           초급
//         </label>
//         <label>
//           <input
//             type="radio"
//             name="level"
//             value="중급"
//             checked={level === '중급'}
//             onChange={(e) => setLevel(e.target.value)}
//           />
//           중급
//         </label>
//         <label>
//           <input
//             type="radio"
//             name="level"
//             value="고급"
//             checked={level === '고급'}
//             onChange={(e) => setLevel(e.target.value)}
//           />
//           고급
//         </label>
//       </div>

//       <input
//         type="number"
//         min={1}
//         max={10}
//         value={count}
//         onChange={(e) => setCount(e.target.value)}
//         style={{ marginTop: '10px', padding: '6px' }}
//       />

//       <br />
//       <button onClick={handleSubmit} style={{ marginTop: '10px' }}>
//         질문 생성
//       </button>

//       <div style={{ marginTop: '20px' }}>
//         {questions.map((q, idx) => (
//           <p key={idx}>
//             <strong>Q{idx + 1}:</strong> {q}
//           </p>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;




import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [field, setField] = useState('');
  const [level, setLevel] = useState('초급');
  const [count, setCount] = useState(3);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [stage, setStage] = useState('form'); // form | question | result
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false); // API 요청 중 여부
  const [sessionData, setSessionData] = useState(null); // 추가: session 관련 상태

  const handleStart = async () => {
    if (loading) return; // 혹시라도 중복 실행 방지
  
    setLoading(true); // 🔒 버튼 잠금
    try {
      const res = await axios.post('http://localhost:8000/api/questions', {
        field,
        level,
        count: Number(count),
      });
      setQuestions(res.data.questions);
      setSessionData({
        field: res.data.field,
        level: res.data.level,
        count: res.data.count,
        session_id: res.data.session_id,
      });
      setStage('question');
    } catch (err) {
      console.error('질문 생성 실패:', err);
    } finally {
      setLoading(false); // 🔓 다시 활성화
    }
  };
  
  const handleAnswerSubmit = async () => {
    if (loading) return;
  
    setLoading(true);
    const newAnswers = [...answers, userAnswer];
    setUserAnswer('');
  
    if (currentQuestionIndex + 1 < questions.length) {
      setAnswers(newAnswers);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setLoading(false);
    } else {
      // 마지막 질문이면 평가 요청
      try {
        const res = await axios.post('http://localhost:8000/api/evaluate', {
          questions,
          answers: newAnswers,
          ...sessionData
        });
        setEvaluations(res.data.evaluations);
        setAnswers(newAnswers);
        setStage('result');
      } catch (err) {
        console.error('채점 오류:', err);
      } finally {
        setLoading(false);
      }
    }
  };  

  // --- 렌더링 분기 ---
  if (stage === 'form') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>AI 면접 연습</h2>
        <input
          placeholder="분야"
          value={field}
          onChange={(e) => setField(e.target.value)}
        />
        <div>
          <label><input type="radio" value="초급" checked={level === '초급'} onChange={(e) => setLevel(e.target.value)} /> 초급</label>
          <label><input type="radio" value="중급" checked={level === '중급'} onChange={(e) => setLevel(e.target.value)} /> 중급</label>
          <label><input type="radio" value="고급" checked={level === '고급'} onChange={(e) => setLevel(e.target.value)} /> 고급</label>
        </div>
        <input
          type="number"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
        <button onClick={handleStart} disabled={loading}>
          {loading ? '질문 생성 중...' : '시작하기'}
        </button>
      </div>
    );
  }

  if (stage === 'question') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>문제 {currentQuestionIndex + 1} / {questions.length}</h2>
        <p>{questions[currentQuestionIndex]}</p>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          rows={4}
          cols={50}
        />
        <br />
        <button onClick={handleAnswerSubmit} disabled={loading}>
          {loading ? '채점 중...' : '제출'}
        </button>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>📊 채점 결과</h2>
        {questions.map((q, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
          <strong>Q{i + 1}:</strong> {q}
          <br />
          <em>당신의 답변:</em> {answers[i]}
          <br />
          <strong>피드백:</strong>
          <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '5px', whiteSpace: 'pre-wrap' }} className="feedback-box">
            <ReactMarkdown>{evaluations[i]}</ReactMarkdown>
          </div>
        </div>
        ))}
      </div>
    );
  }

  return null;
}

export default App;