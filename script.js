// 60 deg угол мжду солнечным лучем и землей, когда солнце в зените. зависит от широты местности
const alphaRadZenith = Math.PI / 3;
const sinAlphaZenith = Math.sin(alphaRadZenith);

class Sun {
    constructor(element) {
        this.element = element;
        this.diameter = this.element.clientHeight;
        this.x = 0;
        this.y = 0;
        this.maxY = 300 + this.diameter;
        this.maxX = document.body.clientWidth - this.diameter;
        this.currentAngle = 0;

        this._initListeners();
    }

    moveToAngleRad(phiRad) {
        this.currentAngle = phiRad;
        this.x = this._calculateWidthByPhi(phiRad);
        this.y = this._calculateHeightByPhi(phiRad);
        this._draw();
    }

    _draw() {
        window.requestAnimationFrame(() => {
            this.element.style.bottom = this.y - (this.diameter/2) + 'px';
            this.element.style.left = this.x + 'px';
        });
    }

    _calculateWidthByPhi(phiRad) {
        return (1 - Math.cos(phiRad)) * (Number((this.maxX / 2).toFixed(0)));
    }

    _calculateHeightByPhi(phiRad) {
        return this.maxY * Math.sin(phiRad);
    }

    _initListeners() {
        window.addEventListener('resize', () => {
            this.maxX = document.body.clientWidth - this.diameter;
            this.moveToAngleRad(this.currentAngle);
        });
    }
}

class Stick {
    constructor(stickElem, stickShadowElem) {
        this.stick = stickElem;
        this.stickHeight = this.stick.clientHeight;
        this.stickShadow = stickShadowElem;
        this.showShadow = false;
        this.shadowMaxLength = this.stickHeight * 8;
        this.shadowLength = this.shadowMaxLength;
        this.shadowRotationAngleInDegrees = - 90;
    }

    moveShadow(phiRad) {
        const phiDeg = Number((phiRad * 180 / Math.PI).toFixed(0));
        this.shadowLength = this.calculateShadowLength(phiRad);
        this.shadowRotationAngleInDegrees = this._calculateShadowRotationDeg(phiDeg);
        this.showShadow = this.shadowRotationAngleInDegrees >= -89 && this.shadowRotationAngleInDegrees <= 89;

        this._draw();
    }

    calculateShadowLength(phiRad) {
        const alphaRad = Math.asin(sinAlphaZenith * Math.sin(phiRad));
        const length = this.stickHeight / Math.tan(alphaRad);
        return length <= this.shadowMaxLength ? length : this.shadowMaxLength;
    }

    _calculateShadowRotationDeg(phiDeg) {
        return phiDeg - 90; // if phi is 0, shadow angle is -90 for transform css property;
    }

    _draw() {
        window.requestAnimationFrame(() => {
            if (this.showShadow) {
                this.stickShadow.style.display = 'block';
                this.stickShadow.style.transform = `rotateZ(${this.shadowRotationAngleInDegrees}deg)`;
                this.stickShadow.style.height = this.shadowLength + 'px';
                return;
            }

            this.stickShadow.style.display = 'none';
        });
    }
}

class System {
    constructor(sun, stick) {
        this.sun = sun;
        this.stick = stick;

        this.startScrollPosition = -1100;
        this.scrollPosition = this.startScrollPosition;

        this.digitsFraction = 3;

        this.subjectLengthElem = document.getElementById('subject-length');
        this.currentShadowLengthElem = document.getElementById('current-shadow-length');
        this.zenithShadowLengthElem = document.getElementById('zenith-shadow-length');
        this.shafiShadowLengthElem = document.getElementById('shafi-shadow-length');
        this.hanafiShadowLengthElem = document.getElementById('hanafi-shadow-length');

        this.draw(0);
        this._initInfo();
    }

    draw(deltaY) {
        this.scrollPosition = this.scrollPosition + deltaY;
        const phiRad = this._scrollPxOffsetToPhiDegreesAngleOffset(this.scrollPosition) * Math.PI / 180;
        this.sun.moveToAngleRad(phiRad);
        this.stick.moveShadow(phiRad);

        this.currentShadowLengthElem.innerText = this.stick.showShadow
            ? (this.stick.shadowLength / 100).toFixed(this.digitsFraction) + ' м'
            : 'Нет тени';
    }

    _scrollPxOffsetToPhiDegreesAngleOffset(offsetY) {
        const pixelsInOneDegree = 114;
        return Number((offsetY / pixelsInOneDegree).toFixed(0));
    }

    _initInfo() {
        // 100px is 1 metre
        const subjectLength = this.stick.stickHeight / 100;
        this.subjectLengthElem.innerText = subjectLength.toFixed(0) + ' м';
        this.currentShadowLengthElem.innerText = 'Нет тени';

        const zenithShadowLength = subjectLength / Math.tan(alphaRadZenith);
        this.zenithShadowLengthElem.innerText = zenithShadowLength.toFixed(this.digitsFraction) + ' м';

        const shafiShadowLength = zenithShadowLength + subjectLength;
        this.shafiShadowLengthElem.innerText = shafiShadowLength.toFixed(this.digitsFraction) + ' м';

        const hanafiShadowLength = zenithShadowLength + (2 * subjectLength);
        this.hanafiShadowLengthElem.innerText = hanafiShadowLength.toFixed(this.digitsFraction) + ' м';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sunElem = document.getElementById('sun');
    const stickElem = document.getElementById('stick');
    const stickShadowElem = document.getElementById('stick-shadow');

    const sunInstance = new Sun(sunElem);
    const stickInstance = new Stick(stickElem, stickShadowElem);
    const system = new System(sunInstance, stickInstance);

    document.addEventListener('wheel', (event) => {
        // positive scroll down, negative scroll up
        system.draw(event.deltaY);
    });
});
