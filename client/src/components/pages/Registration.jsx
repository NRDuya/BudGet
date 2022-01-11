import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../Navbar';

function Registration(){
    const usernameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const cpasswordRef = useRef();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const res = await axios.post('/users/register', {
                username: usernameRef.current.value,
                email: emailRef.current.value,
                password: passwordRef.current.value,
                cpassword: cpasswordRef.current.value
            });

            if (res.data.success) {
                navigate('/login');
            } else {
                console.log(res.data.message)
                window.location.reload(false);
            }
        }
        catch (err) {
            window.location.reload(false);
        }
    };

    return(
        <>
            <Navigation />
            <form onSubmit={handleSubmit}>
                <div className='form-field'>
                    <label>Username</label>
                    <input id="username" type="name" placeholder="Username" ref={usernameRef} required />
                </div>
                <div className='form-field'>
                    <label>Email</label>
                    <input id="email" type="email" placeholder="Email" ref={emailRef} required />
                </div>
                <div className='form-field'>
                    <label>Password</label>
                    <input id="password" type="password" placeholder="Password" ref={passwordRef} required />
                </div>
                <div className='form-field'>
                    <label>Confirm Password</label>
                    <input id="cpassword" type="password" placeholder="Confirm Password" ref={cpasswordRef} required />
                </div>

                <div>
                    <Link to='/login'>
                        Have An Account?
                    </Link>
                </div>
                <button type="submit">Submit</button>

            </form>
        </>
        
    );
}

export default Registration;