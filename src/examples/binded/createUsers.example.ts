import {ModuleBinded} from "../../types";

export interface User {
    name: string;
    isSuperUser: boolean;
}

export function createUsers(module: ModuleBinded) {
    const users: User[] = [
        {name: 'Oleg', isSuperUser: false},
        {name: 'Rurik', isSuperUser: true},
        {name: 'Alexander', isSuperUser: false}
    ];

    const result = module.createUsers(users);
    console.log('Новые пользователи:', result);
}
