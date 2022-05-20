import {React, useState, useEffect} from 'react'

function Member() {
    const [data, setData] = useState([{}])

    useEffect(()=> {
      fetch("/members").then(
        res => res.json()
        ).then(
          data => {
            setData(data)
            console.log(data)
          }
        )
    }, [])
  
    return (
        <div>
            {(typeof data.members === 'undefined') ? (
                <p>Loading...</p>
                ) : (
                data.members.map((member, index) => (
                    <p key = {index}>{member}</p>
                ))
            )}
        </div>
    )
}

export default Member